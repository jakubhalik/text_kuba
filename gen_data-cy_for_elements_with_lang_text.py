import os
import re

def remove_duplicate_data_cy(file_path):
    with open(file_path, 'r', encoding='utf-8') as file:
        content = file.read()

    new_content = re.sub(r'(\sdata-cy="([a-zA-Z0-9_]+)")(?=.*?\1)', '', content, flags=re.DOTALL)

    if new_content != content:
        print(f'Removed duplicate data-cy from {file_path}')
        with open(file_path, 'w', encoding='utf-8') as file:
            file.write(new_content)

changed_files = []

def add_data_cy_property(file_path):
    with open(file_path, 'r', encoding='utf-8') as file:
        content = file.read()

    pattern_inline = re.compile(r'(<[^>]*\{texts\.([a-zA-Z0-9_]+)\}[^>]*)/?>(?!\s*data-cy)')
    pattern_block = re.compile(r'(<([a-zA-Z0-9]+)[^>]*)(>)(\s*\{texts\.([a-zA-Z0-9_]+)\}\s*)(</\2>)')
    pattern_conditional = re.compile(r'(<([a-zA-Z0-9]+)[^>]*)(>)(\s*\{([^{}]+)\s*\?\s*texts\.([a-zA-Z0-9_]+)\s*:\s*texts\.([a-zA-Z0-9_]+)\}\s*)(.*?)(</\2>)', re.DOTALL)
    pattern_conditional_button = re.compile(r'(<button[^>]*)(>)(\s*\{([^{}]+)\s*\?\s*texts\.([a-zA-Z0-9_]+)\s*:\s*texts\.([a-zA-Z0-9_]+)\}\s*)(.*?)(</button>)', re.DOTALL)
    pattern_property = re.compile(r'(<[^>]*\s)([a-zA-Z0-9_-]+=\{\s*texts\.([a-zA-Z0-9_]+)\s*\})')

    data_cy_pattern = re.compile(r'data-cy="([a-zA-Z0-9_]+)"')

    def replace_inline(match):
        tag_content = match.group(1)
        dynamic_name = match.group(2)

        if data_cy_pattern.search(tag_content):
            return match.group(0)

        if tag_content.endswith('/'):
            tag_content = tag_content.rstrip('/')
            return f'{tag_content} data-cy="{dynamic_name}" />'
        else:
            return f'{tag_content} data-cy="{dynamic_name}">'

    def replace_block(match):
        start_tag = match.group(1)
        dynamic_name = match.group(5)
        dynamic_text = match.group(4)
        end_tag = match.group(6)

        if 'data-cy=' in start_tag:
            return match.group(0)

        return f'{start_tag} data-cy="{dynamic_name}">{dynamic_text}{end_tag}'

    def replace_conditional(match):
        start_tag = match.group(1)
        condition = match.group(5)
        true_name = match.group(6)
        false_name = match.group(7)
        dynamic_text = match.group(4)
        content_between = match.group(8)
        end_tag = match.group(9)

        if 'data-cy=' in start_tag:
            return match.group(0)

        return f'{start_tag} data-cy={{{condition} ? "{true_name}" : "{false_name}"}}>{dynamic_text}{content_between}{end_tag}'

    def replace_conditional_button(match):
        start_tag = match.group(1)
        condition = match.group(4)
        true_name = match.group(5)
        false_name = match.group(6)
        dynamic_text = match.group(3)
        content_between = match.group(7)
        end_tag = match.group(8)

        if 'data-cy=' in start_tag:
            return match.group(0)

        return f'{start_tag} data-cy={{{condition} ? "{true_name}" : "{false_name}"}}>{dynamic_text}{content_between}{end_tag}'

    def replace_property(match):
        tag_start = match.group(1)
        property_content = match.group(2)
        dynamic_name = match.group(3)

        if data_cy_pattern.search(tag_start + property_content):
            return match.group(0)

        return f'{tag_start}{property_content} data-cy="{dynamic_name}"'

    new_content = pattern_inline.sub(replace_inline, content)
    new_content = pattern_block.sub(replace_block, new_content)
    new_content = pattern_conditional.sub(replace_conditional, new_content)
    new_content = pattern_conditional_button.sub(replace_conditional_button, new_content)
    new_content = pattern_property.sub(replace_property, new_content)

    if new_content != content:
        print(f'Changes made to {file_path}:')
        changed_files.append(file_path)  # Track changed files
        old_lines = content.splitlines()
        new_lines = new_content.splitlines()
        for old_line, new_line in zip(old_lines, new_lines):
            if old_line != new_line:
                print(f'- {old_line}')
                print(f'+ {new_line}')
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

for file_path in changed_files:
    remove_duplicate_data_cy(file_path)

print("All done!")

