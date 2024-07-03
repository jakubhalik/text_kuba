import os
import re

def add_data_cy_property(file_path):
    with open(file_path, 'r', encoding='utf-8') as file:
        content = file.read()

    pattern = re.compile(r'(<[^>]*\{texts\.([a-zA-Z0-9_]+)\}[^>]*)/?>(?!\s*data-cy)')

    def replace(match):
        tag_content = match.group(1)
        dynamic_name = match.group(2)
        if tag_content.endswith('/'):
            tag_content = tag_content[:-1]
            return f'{tag_content} data-cy="{dynamic_name}"/>'
        else:
            return f'{tag_content} data-cy="{dynamic_name}">'

    new_content = pattern.sub(replace, content)

    if new_content != content:
        print(f'Changes made to {file_path}:')
        with open(file_path, 'w', encoding='utf-8') as file:
            file.write(new_content)
    else:
        print(f'No changes made to {file_path}')

def process_directory(directory):
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith('.tsx'):
                file_path = os.path.join(root, file)
                add_data_cy_property(file_path)

process_directory('./components')
process_directory('./app')

print("All done!")

