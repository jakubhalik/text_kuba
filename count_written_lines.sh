#!/bin/bash

count_lines() {
    local file=$1
    wc -l < "$file"
}

export -f count_lines

total=0

while IFS= read -r -d '' file; do
    if [[ "$file" == *"/.git/"* || "$file" == *"/.next/"* || "$file" == *"/node_modules/"* || "$file" == "./bun.lockb" || "$file" == "./dev.log" || "$file" == "./dev1.log" || "$file" == "./count_written_lines" || "$file" == "./setup_db" || "$file" == "./kill_postgres" || "$file" == *"/public/"* ]]; then
        continue
    fi

    count=$(count_lines "$file")
    formatted_count=$(echo $count | sed ':a;s/\B[0-9]\{3\}\>/ &/;ta')
    echo "$file: $formatted_count"
    total=$((total + count))
done < <(find . -type f -print0)

formatted_total=$(echo $total | sed ':a;s/\B[0-9]\{3\}\>/ &/;ta')
echo "Total lines in all directories: $formatted_total"

