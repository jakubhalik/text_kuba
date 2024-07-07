#!/bin/bash

count_lines() {
    local file=$1
    wc -l < "$file"
}

export -f count_lines

total=0

while IFS= read -r -d '' file; do
    # Exclude files in .git, .next, and node_modules directories
    if [[ "$file" == *"/.git/"* || "$file" == *"/.next/"* || "$file" == *"/node_modules/"* ]]; then
        continue
    fi

    count=$(count_lines "$file")
    formatted_count=$(echo $count | sed ':a;s/\B[0-9]\{3\}\>/ &/;ta')
    echo "$file: $formatted_count"
    total=$((total + count))
done < <(find . -type f -print0)

formatted_total=$(echo $total | sed ':a;s/\B[0-9]\{3\}\>/ &/;ta')
echo "Total lines in all directories: $formatted_total"

