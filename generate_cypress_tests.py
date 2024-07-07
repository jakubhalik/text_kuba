import os
import re

with open('.env') as f:
    owner = re.search(r'owner=(\w+)', f.read()).group(1)

orig_file = f"cypress/e2e/text_{owner}_dev/text_{owner}.cy.ts"
output_dir = f"cypress/e2e/text_{owner}_dev"

print(f"Owner: {owner}")
print(f"Original file: {orig_file}")

# Ensure the output directory exists
os.makedirs(output_dir, exist_ok=True)

with open(orig_file, 'r') as f:
    content = f.read()

it_block_pattern = re.compile(r"(it\('([^']+)'\s*,\s*\(\)\s*=>\s*\{)")
matches = list(it_block_pattern.finditer(content))

if not matches:
    print("No 'it' blocks found.")
else:
    print(f"Found {len(matches)} 'it' blocks.")

def get_used_imports(block_content):
    imports = []
    if 'owner' in block_content:
        imports.append('import { owner } from "../../../postgresConfig";\n')
    if 'us.' in block_content:
        imports.append('import us from "../../../lang_us.json";\n')
    if 'cz.' in block_content:
        imports.append('import cz from "../../../lang_cz.json";\n')
    if 'randomPassword' in block_content or 'randomName' in block_content:
        imports.append('import { randomPassword, randomName } from "../../../lib/utils";\n')
    return imports

for i, match in enumerate(matches):
    start_idx = match.start()
    description = match.group(2)
    print(f"Processing 'it' block: {description}")

    stack = []
    end_idx = start_idx

    for j, char in enumerate(content[start_idx:], start=start_idx):
        if char == '{':
            stack.append('{')
        elif char == '}':
            stack.pop()
            if not stack:
                end_idx = j + 1
                if content[start_idx:end_idx].strip().endswith('}'):
                    end_idx += 1  
                break

    test_content = content[start_idx:end_idx]
    if test_content.strip().endswith('}'):
        test_content += ')'  

    test_name = re.sub(r'[^\w\s]', '', description).replace(' ', '_').lower()
    output_file = os.path.join(output_dir, f"{test_name}.cy.ts")

    used_imports = get_used_imports(test_content)

    with open(output_file, 'w') as out_file:
        for imp in used_imports:
            out_file.write(imp)
        out_file.write(f"context('{description}', () => {{\n")
        out_file.write(f"    beforeEach(() => {{\n")
        out_file.write(f"        cy.visit('http://localhost:3000');\n")
        out_file.write(f"    }});\n")
        out_file.write(test_content)
        out_file.write(f"\n}});\n")

    print(f"Written to file: {output_file}")

print("Task completed.")

