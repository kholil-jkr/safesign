#!/usr/bin/env python3
"""Insert manage-role guard into all manage-module API handlers."""
import re, sys

FILES = [
    "src/app/api/contracts/route.ts",
    "src/app/api/contracts/[id]/route.ts",
    "src/app/api/contracts/[id]/versions/route.ts",
    "src/app/api/contracts/[id]/reminders/route.ts",
    "src/app/api/contracts/[id]/sign/route.ts",
    "src/app/api/contracts/[id]/workflow/route.ts",
    "src/app/api/dashboard/route.ts",
    "src/app/api/export/route.ts",
    "src/app/api/users/route.ts",
    "src/app/api/templates/route.ts",
    "src/app/api/notifications/route.ts",
    "src/app/api/ai/extract-fields/route.ts",
]

GUARD = (
    "    const authUser = await getSessionUser();\n"
    "    if (!authUser || !isManageRole(authUser.role)) {\n"
    "      return NextResponse.json({ ok: false, error: \"FORBIDDEN\" }, { status: 403 });\n"
    "    }\n"
)

IMPORT = 'import { getSessionUser, isManageRole } from "@/lib/auth";\n'

handler_re = re.compile(
    r"(export async function (?:GET|POST|PATCH|PUT|DELETE)\((?:[^()]*)\)\s*\{)",
    re.DOTALL,
)

for path in FILES:
    with open(path) as f:
        src = f.read()
    if "getSessionUser" in src:
        print(f"SKIP (already guarded): {path}")
        continue
    # insert import after last import line
    import_lines = list(re.finditer(r"^import .*?;$", src, re.MULTILINE))
    if not import_lines:
        print(f"SKIP (no imports): {path}")
        continue
    last = import_lines[-1]
    src = src[: last.end()] + "\n" + IMPORT + src[last.end():]
    # insert guard after each handler opening
    n = 0
    def repl(m):
        global n
        n += 1
        return m.group(1) + "\n" + GUARD
    src = handler_re.sub(repl, src)
    with open(path, "w") as f:
        f.write(src)
    print(f"OK {path}: {n} handlers guarded")
print("done")
