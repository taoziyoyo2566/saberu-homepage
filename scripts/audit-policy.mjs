/**
 * Pure evaluation of the dependency audit policy, kept separate from
 * `scripts/audit.mjs` so the gate itself is unit-tested.
 *
 * Policy (see docs/development.md):
 * - production dependencies must have no advisory at all. Production means
 *   reachable from package.json `dependencies` through dependencies, optional
 *   dependencies and required peers. `npm audit --omit=dev` also reports
 *   packages that a production package names only as an optional peer while
 *   a devDependency installs them (npm marks them devOptional; for example
 *   next -> @playwright/test). Those are judged as development dependencies;
 * - an advisory reaching only development dependencies passes only when an
 *   unexpired exception in `audit-exceptions.json` names the advisory, the
 *   package and every dependency path through which it is reached;
 * - an exception stops applying when npm reports no path (the scope cannot be
 *   checked) or a fix that needs no major upgrade (update instead);
 * - an expired or malformed exception fails the audit; an exception, or an
 *   accepted path, that no longer matches anything is reported for removal.
 */

const GHSA_PATTERN = /^GHSA(-[0-9a-z]{4}){3}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * @typedef {{ via?: unknown[], effects?: string[], isDirect?: boolean, fixAvailable?: unknown, nodes?: unknown }} VulnerabilityEntry
 * @typedef {{ advisory: string, package: string, severity: string, title: string, paths: string[], nodes: string[], nonBreakingFix: boolean }} Advisory
 * @typedef {{ dependencies?: Record<string, string>, optionalDependencies?: Record<string, string>, peerDependencies?: Record<string, string>, peerDependenciesMeta?: Record<string, { optional?: boolean }>, devOptional?: boolean, link?: boolean, resolved?: string }} LockEntry
 */

/**
 * The `packages` map of a lockfileVersion 2 or 3 package-lock.json.
 * @param {unknown} lockfile
 * @returns {Record<string, LockEntry>}
 */
function lockPackages(lockfile) {
  const packages =
    lockfile !== null && typeof lockfile === "object"
      ? /** @type {{ packages?: unknown }} */ (lockfile).packages
      : undefined;
  if (
    packages === null ||
    typeof packages !== "object" ||
    !Object.hasOwn(packages, "")
  ) {
    throw new Error(
      "package-lock.json has no packages map with a root entry (lockfileVersion 2 or 3 required)",
    );
  }
  return /** @type {Record<string, LockEntry>} */ (packages);
}

/**
 * Location of the copy of `name` that the package at `from` loads, using
 * Node's lookup: its own node_modules first, then each enclosing one.
 * @param {Record<string, LockEntry>} packages
 * @param {string} from
 * @param {string} name
 * @returns {string | null}
 */
function resolveDependency(packages, from, name) {
  let base = from;
  for (;;) {
    const candidate =
      base === "" ? `node_modules/${name}` : `${base}/node_modules/${name}`;
    if (Object.hasOwn(packages, candidate)) {
      return candidate;
    }
    if (base === "") {
      return null;
    }
    const cut = base.lastIndexOf("/node_modules/");
    base = cut < 0 ? "" : base.slice(0, cut);
  }
}

/**
 * Installed locations reachable from the root's production dependencies
 * through dependencies, optional dependencies and required peers. Optional
 * peers and devDependencies are not followed.
 * @param {unknown} lockfile
 * @returns {Set<string>}
 */
export function productionNodes(lockfile) {
  const packages = lockPackages(lockfile);
  const reached = new Set();
  const queue = [""];
  while (queue.length > 0) {
    const location = /** @type {string} */ (queue.pop());
    if (reached.has(location)) {
      continue;
    }
    reached.add(location);
    const entry = packages[location] ?? {};
    if (entry.link && typeof entry.resolved === "string") {
      queue.push(entry.resolved);
    }
    const optionalPeers = entry.peerDependenciesMeta ?? {};
    const names = [
      ...Object.keys(entry.dependencies ?? {}),
      ...Object.keys(entry.optionalDependencies ?? {}),
      ...Object.keys(entry.peerDependencies ?? {}).filter(
        (name) => optionalPeers[name]?.optional !== true,
      ),
    ];
    for (const name of names) {
      // Optional dependencies for other platforms may be absent; that is fine.
      const target = resolveDependency(packages, location, name);
      if (target !== null) {
        queue.push(target);
      }
    }
  }
  reached.delete("");
  return reached;
}

/**
 * npm's `fixAvailable` is `true` when `npm audit fix` can resolve the entry
 * within the current ranges, or an object naming a target and whether it is
 * a semver-major change.
 * @param {unknown} fixAvailable
 */
function isNonBreakingFix(fixAvailable) {
  if (fixAvailable === true) {
    return true;
  }
  return (
    fixAvailable !== null &&
    typeof fixAvailable === "object" &&
    /** @type {{ isSemVerMajor?: unknown }} */ (fixAvailable).isSemVerMajor ===
      false
  );
}

/**
 * @param {unknown} report
 * @returns {Record<string, VulnerabilityEntry>}
 */
function vulnerabilitiesOf(report) {
  if (report === null || typeof report !== "object" || "error" in report) {
    const detail =
      report && typeof report === "object" && "error" in report
        ? JSON.stringify(/** @type {{ error: unknown }} */ (report).error)
        : "";
    throw new Error(`npm audit did not return a report ${detail}`.trim());
  }
  const { vulnerabilities } = /** @type {{ vulnerabilities?: unknown }} */ (
    report
  );
  if (
    vulnerabilities === undefined ||
    vulnerabilities === null ||
    typeof vulnerabilities !== "object"
  ) {
    throw new Error("npm audit report has no vulnerabilities map");
  }
  return /** @type {Record<string, VulnerabilityEntry>} */ (vulnerabilities);
}

/**
 * Every chain from a direct dependency down to `name`, written "a>b>name",
 * following the `effects` (dependents) recorded by npm audit.
 * @param {Record<string, VulnerabilityEntry>} vulnerabilities
 * @param {string} name
 * @returns {string[]}
 */
export function dependencyPaths(vulnerabilities, name) {
  const paths = new Set();
  /** @param {string} current @param {string[]} chain */
  function walk(current, chain) {
    const entry = vulnerabilities[current];
    if (!entry || chain.includes(current)) {
      return;
    }
    const next = [current, ...chain];
    if (entry.isDirect) {
      paths.add(next.join(">"));
    }
    for (const dependent of entry.effects ?? []) {
      walk(dependent, next);
    }
  }
  walk(name, []);
  return [...paths].sort();
}

/**
 * Advisories in an `npm audit --json` report, one per (advisory, package),
 * with the dependency paths that reach the vulnerable package.
 * @param {unknown} report
 * @returns {Advisory[]}
 */
export function collectAdvisories(report) {
  const vulnerabilities = vulnerabilitiesOf(report);
  /** @type {Map<string, Advisory>} */
  const found = new Map();
  for (const [packageName, entry] of Object.entries(vulnerabilities)) {
    for (const via of entry.via ?? []) {
      if (via === null || typeof via !== "object") {
        continue;
      }
      const {
        url = "",
        severity = "unknown",
        title = "",
      } = /** @type {Record<string, string>} */ (via);
      const advisory = url.split("/").pop() ?? "";
      const key = `${advisory}|${packageName}`;
      if (!found.has(key)) {
        found.set(key, {
          advisory,
          package: packageName,
          severity,
          title,
          paths: dependencyPaths(vulnerabilities, packageName),
          nodes: Array.isArray(entry.nodes)
            ? entry.nodes.filter((node) => typeof node === "string")
            : [],
          nonBreakingFix: isNonBreakingFix(entry.fixAvailable),
        });
      }
    }
  }
  return [...found.values()];
}

/**
 * @param {unknown} exception
 * @param {number} index
 * @returns {string[]}
 */
function exceptionErrors(exception, index) {
  const label = `exception #${index + 1}`;
  if (exception === null || typeof exception !== "object") {
    return [`${label} must be an object`];
  }
  const {
    advisory,
    package: name,
    paths,
    scope,
    reason,
    owner,
    blocker,
    reviewBy,
  } = /** @type {Record<string, unknown>} */ (exception);
  const errors = [];
  if (typeof advisory !== "string" || !GHSA_PATTERN.test(advisory)) {
    errors.push(`${label}: advisory must be a GHSA id`);
  }
  if (typeof name !== "string" || name.trim() === "") {
    errors.push(`${label}: package is required`);
  }
  if (
    !Array.isArray(paths) ||
    paths.length === 0 ||
    !paths.every(
      (path) =>
        typeof path === "string" &&
        typeof name === "string" &&
        path.endsWith(name),
    )
  ) {
    errors.push(
      `${label}: paths must list each "direct>…>package" chain that is accepted`,
    );
  }
  if (scope !== "dev") {
    errors.push(
      `${label}: scope must be "dev"; production advisories are never accepted`,
    );
  }
  if (typeof reason !== "string" || reason.trim().length < 20) {
    errors.push(`${label}: reason must explain why the risk is acceptable`);
  }
  if (typeof owner !== "string" || owner.trim() === "") {
    errors.push(`${label}: owner (who accepted the risk) is required`);
  }
  if (typeof blocker !== "string" || blocker.trim() === "") {
    errors.push(`${label}: blocker (why it cannot be fixed now) is required`);
  }
  if (
    typeof reviewBy !== "string" ||
    !DATE_PATTERN.test(reviewBy) ||
    Number.isNaN(Date.parse(reviewBy))
  ) {
    errors.push(`${label}: reviewBy must be a YYYY-MM-DD date`);
  }
  return errors;
}

/**
 * @param {{ production: unknown, full: unknown, lockfile: unknown, exceptions: unknown, today: string }} input
 */
export function evaluateAudit({
  production,
  full,
  lockfile,
  exceptions,
  today,
}) {
  const errors = [];
  const packages = lockPackages(lockfile);
  const reachable = productionNodes(lockfile);
  // Only when npm itself marks every vulnerable copy devOptional and none is
  // reachable through required edges; anything else stays production.
  /** @param {Advisory} item */
  const optionalPeerOnly = (item) =>
    item.nodes.length > 0 &&
    item.nodes.every(
      (node) => packages[node]?.devOptional === true && !reachable.has(node),
    );
  const reported = collectAdvisories(production);
  const productionAdvisories = reported.filter(
    (item) => !optionalPeerOnly(item),
  );
  const reclassified = reported.filter(optionalPeerOnly);
  const allAdvisories = collectAdvisories(full);
  const productionKeys = new Set(
    productionAdvisories.map((item) => `${item.advisory}|${item.package}`),
  );
  const devOnly = allAdvisories.filter(
    (item) => !productionKeys.has(`${item.advisory}|${item.package}`),
  );

  const list =
    exceptions !== null &&
    typeof exceptions === "object" &&
    Array.isArray(
      /** @type {{ exceptions?: unknown }} */ (exceptions).exceptions,
    )
      ? /** @type {Record<string, unknown>[]} */ (
          /** @type {{ exceptions: unknown[] }} */ (exceptions).exceptions
        )
      : null;
  if (list === null) {
    errors.push('audit-exceptions.json must contain an "exceptions" array');
  }
  const entries = list ?? [];
  entries.forEach((entry, index) =>
    errors.push(...exceptionErrors(entry, index)),
  );

  for (const item of productionAdvisories) {
    errors.push(
      `production dependency ${item.package} has ${item.advisory} (${item.severity}): ${item.title}`,
    );
  }

  const accepted = [];
  for (const item of devOnly) {
    const match = entries.find(
      (entry) =>
        entry &&
        entry.advisory === item.advisory &&
        entry.package === item.package &&
        entry.scope === "dev",
    );
    if (!match) {
      errors.push(
        `development dependency ${item.package} has ${item.advisory} (${item.severity}) without an exception: ${item.title}`,
      );
      continue;
    }
    const acceptedPaths = Array.isArray(match.paths) ? match.paths : [];
    const unaccepted = item.paths.filter(
      (path) => !acceptedPaths.includes(path),
    );
    if (item.paths.length === 0) {
      errors.push(
        `${item.advisory} (${item.package}): npm reports no dependency path, so the exception's scope cannot be checked`,
      );
    } else if (item.nonBreakingFix) {
      errors.push(
        `${item.advisory} (${item.package}): a fix without a major upgrade is available; update the dependency and remove the exception`,
      );
    } else if (unaccepted.length > 0) {
      errors.push(
        `${item.advisory} reaches ${item.package} through unaccepted paths: ${unaccepted.join(", ")}`,
      );
    } else if (typeof match.reviewBy === "string" && match.reviewBy < today) {
      errors.push(
        `exception for ${item.advisory} (${item.package}) expired on ${match.reviewBy}; review it again`,
      );
    } else {
      accepted.push({ ...item, reviewBy: match.reviewBy, owner: match.owner });
    }
  }

  /** @type {string[]} */
  const stale = [];
  for (const entry of entries) {
    if (!entry) {
      continue;
    }
    const current = allAdvisories.find(
      (item) =>
        item.advisory === entry.advisory && item.package === entry.package,
    );
    if (!current) {
      stale.push(
        `exception ${String(entry.advisory)} (${String(entry.package)}) matches no current advisory`,
      );
      continue;
    }
    for (const path of Array.isArray(entry.paths) ? entry.paths : []) {
      if (!current.paths.includes(path)) {
        stale.push(
          `exception ${String(entry.advisory)} lists path ${String(path)}, which no longer exists`,
        );
      }
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    productionAdvisories,
    reclassified,
    devOnly,
    accepted,
    stale,
  };
}
