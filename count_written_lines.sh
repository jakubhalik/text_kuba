#!/bin/bash

count_lines() {
    local dir=$1
    echo "Counting lines in directory: $dir" >&2
    find "$dir" -maxdepth 1 -type f -exec cat {} + | wc -l
}

export -f count_lines

total=0

processed_dirs=()

while IFS= read -r -d '' dir; do
    # Skip directories that are in the exclusion list or already processed
    if [[ " ${processed_dirs[@]} " =~ " ${dir} " ]]; then
        continue
    fi

    count=$(count_lines "$dir")
    formatted_count=$(echo $count | sed ':a;s/\B[0-9]\{3\}\>/ &/;ta')
    echo "$dir: $formatted_count"
    total=$((total + count))

    # Add directory to processed list
    processed_dirs+=("$dir")
done < <(find . -mindepth 1 -type d \( -name .git -o -name .next -o -name node_modules \) -prune -o -print0)

formatted_total=$(echo $total | sed ':a;s/\B[0-9]\{3\}\>/ &/;ta')
echo "Total lines in all directories: $formatted_total"

