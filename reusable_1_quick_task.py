import os, boto3
from dotenv import load_dotenv
load_dotenv()
s3 = boto3.client("s3",
    endpoint_url="https://" + os.getenv("R2_ACCOUNT_ID") + ".r2.cloudflarestorage.com",
    aws_access_key_id=os.getenv("R2_ACCESS_KEY"),
    aws_secret_access_key=os.getenv("R2_SECRET_KEY"))
bucket = os.getenv("R2_BUCKET")

TARGETS = ["kitab-al-duafa-ghadairi", "kitab-al-ghayba-tusi", "maani-al-akhbar-saduq"]

print("=" * 70)
print("R2 COPIES")
print("=" * 70)
r = s3.list_objects_v2(Bucket=bucket, Prefix="data/islamic/")
r2_hits = []
for o in r.get("Contents", []):
    for t in TARGETS:
        if t in o["Key"]:
            r2_hits.append(o["Key"])
            print("  R2: " + o["Key"] + "  (" + str(o["Size"]) + " bytes)")

print()
print("=" * 70)
print("LOCAL COPIES")
print("=" * 70)
roots = [r"Z:\\Islamic App\\rv-research", r"Z:\\Islamic App\\bv-app"]
local_hits = []
for root in roots:
    for dirpath, dirs, files in os.walk(root):
        if "_backups" in dirpath or "node_modules" in dirpath:
            continue
        for f in files:
            for t in TARGETS:
                if t in f:
                    full = os.path.join(dirpath, f)
                    local_hits.append(full)
                    sz = os.path.getsize(full)
                    print("  LOCAL: " + full + "  (" + str(sz) + " bytes)")

print()
print("R2 copies found: " + str(len(r2_hits)))
print("Local copies found: " + str(len(local_hits)))
