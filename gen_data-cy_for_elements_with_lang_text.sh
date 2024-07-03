#!/bin/bash

add_data_cy_property() {
  file=$1
  temp_file=$(mktemp)

  echo "Processing file: $file"

  perl -0777 -pe '
    s{
      (<[^>]*)(\{texts\.([a-zA-Z0-9_]+)\})([^>]*/?>)
    }{
      $1 . $2 . $4 . " data-cy=\"" . $3 . "\""
    }ge' "$file" > "$temp_file"

  if diff "$file" "$temp_file" > /dev/null; then
    echo "No changes made to $file"
  else
    echo "Changes made to $file:"
    diff "$file" "$temp_file"
  fi

  mv "$temp_file" "$file"
}

export -f add_data_cy_property

find ./components ./app -type f -name "*.tsx" -exec bash -c 'add_data_cy_property "$0"' {} \;

echo "All done!"

