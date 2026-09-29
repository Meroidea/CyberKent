"""
Regenerates the Mermaid ERDs in this folder from backend/prisma/schema.prisma.

    python3 database/erd/generate_erd.py

The overview lists every table and every foreign key; each domain file shows
its tables with their columns and the foreign keys between them. Render the
PNGs afterwards with Mermaid CLI:

    npx -y @mermaid-js/mermaid-cli -i erd-1-identity.mmd -o erd-1-identity.png -b white -s 2
"""

import re
from pathlib import Path

HERE = Path(__file__).resolve().parent
SCHEMA = HERE.parents[1] / "backend" / "prisma" / "schema.prisma"

# Which tables each domain diagram shows. A table may appear in several.
DOMAINS = {
    "erd-1-identity.mmd": ["User", "EmailVerificationToken", "PasswordResetToken", "NotificationPreference", "AccountDeletionRequest", "AuditLog"],
    "erd-2-analysis-ai.mmd": ["User", "ScamCheck", "ScamCheckIndicator", "Indicator", "ReportIndicator", "AiInteraction"],
    "erd-3-reports.mmd": ["User", "Report", "ScamCategory", "Suburb", "ReportRelation", "Evidence", "EvidenceAccessLog", "ReportReview", "InformationRequest"],
    "erd-4-community.mmd": ["User", "Alert", "Report", "ScamCategory", "Suburb", "Subscription", "Notification", "AwarenessResource", "RecoveryChecklist", "RecoveryStep", "RecoveryProgress"],
    "erd-5-console-admin.mmd": ["User", "Task", "TaskComment", "Report", "SiteNotice", "AwarenessResource"],
}

SCALARS = {"String": "string", "DateTime": "datetime", "Int": "int", "Float": "float", "Boolean": "boolean", "Json": "json", "BigInt": "int", "Decimal": "float"}


def parse(text: str):
    enums = set(re.findall(r"^enum (\w+) \{", text, re.M))
    models: dict[str, dict] = {}
    order: list[str] = []
    for name, body in re.findall(r"^model (\w+) \{\n(.*?)^\}", text, re.M | re.S):
        order.append(name)
        columns, relations, composite_id, uniques = [], [], [], set()
        for raw in body.splitlines():
            line = raw.split("//")[0].strip()
            if not line:
                continue
            if line.startswith("@@id"):
                composite_id = re.findall(r"\w+", line.split("[", 1)[1].split("]")[0])
                continue
            if line.startswith("@@unique"):
                fields = re.findall(r"\w+", line.split("[", 1)[1].split("]")[0])
                if len(fields) == 1:
                    uniques.add(fields[0])
                continue
            if line.startswith("@@"):
                continue
            field, ftype, *rest = line.split(None, 2)
            attrs = rest[0] if rest else ""
            base = ftype.rstrip("?").removesuffix("[]")
            if base in SCALARS or base in enums:
                columns.append({
                    "name": field,
                    "type": SCALARS.get(base, base) + ("[]" if ftype.endswith("[]") else ""),
                    "optional": ftype.endswith("?"),
                    "id": "@id" in attrs,
                    "unique": "@unique" in attrs,
                })
            else:
                match = re.search(r"fields:\s*\[(\w+)\]", attrs)
                if match:
                    relations.append({"target": base, "fk": match.group(1)})
        for column in columns:
            column["id"] = column["id"] or column["name"] in composite_id
            column["unique"] = column["unique"] or column["name"] in uniques
        models[name] = {"columns": columns, "relations": relations}
    return order, models


def relationship_lines(order, models, only=None):
    lines = []
    for child in order:
        if only is not None and child not in only:
            continue
        columns = {c["name"]: c for c in models[child]["columns"]}
        for relation in models[child]["relations"]:
            parent = relation["target"]
            if only is not None and parent not in only:
                continue
            fk = columns[relation["fk"]]
            left = "|o" if fk["optional"] else "||"
            right = "o|" if fk["unique"] or (fk["id"] and len([c for c in columns.values() if c["id"]]) == 1) else "o{"
            lines.append(f'  {parent} {left}--{right} {child} : "{relation["fk"]}"')
    return lines


def entity(name, model):
    fks = {r["fk"] for r in model["relations"]}
    lines = [f"  {name} {{"]
    for column in model["columns"]:
        keys = [k for k, on in (("PK", column["id"]), ("FK", column["name"] in fks), ("UK", column["unique"] and not column["id"])) if on]
        note = '"optional"' if column["optional"] else ""
        # "type name KEYS note", one space apart, as the original export wrote them.
        lines.append(f"    {column['type']} {column['name']} " + " ".join(part for part in (",".join(keys), note) if part))
    lines.append("  }")
    return lines


def main() -> None:
    order, models = parse(SCHEMA.read_text())

    overview = ["erDiagram"]
    for name in order:
        overview += [f"  {name} {{", "  }"]
    overview += relationship_lines(order, models)
    (HERE / "erd-0-overview.mmd").write_text("\n".join(overview) + "\n")

    for filename, tables in DOMAINS.items():
        missing = [t for t in tables if t not in models]
        if missing:
            raise SystemExit(f"{filename}: no such model {missing}")
        lines = ["erDiagram"]
        for table in tables:
            lines += entity(table, models[table])
        lines += relationship_lines(order, models, only=set(tables))
        (HERE / filename).write_text("\n".join(lines) + "\n")

    covered = {t for tables in DOMAINS.values() for t in tables}
    uncovered = [m for m in order if m not in covered]
    print(f"{len(order)} tables; overview + {len(DOMAINS)} domain diagrams written." + (f" Not in any domain: {uncovered}" if uncovered else ""))


if __name__ == "__main__":
    main()
