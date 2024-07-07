import os
import re

with open('.env') as f:
    owner = re.search(r'owner=(\w+)', f.read()).group(1)

output_dir = f"cypress/e2e/text_{owner}_dev"

print(f"Owner: {owner}")
print(f"Output directory: {output_dir}")

generated_files = []
for filename in os.listdir(output_dir):
    if re.match(r'^[a-z_]+\.cy\.ts$', filename) and filename != f"text_{owner}.cy.ts":
        generated_files.append(filename)

if not generated_files:
    print("No generated files found to remove.")
else:
    print(f"Found {len(generated_files)} generated files.")

    for filename in generated_files:
        file_path = os.path.join(output_dir, filename)
        os.remove(file_path)
        print(f"Removed file: {file_path}")

print("Task completed.")
