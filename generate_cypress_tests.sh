#!/bin/bash

# Define the path to the original test file based on the owner value from .env
owner=$(grep 'owner' .env | cut -d '=' -f 2)
orig_file="cypress/e2e/text_${owner}_dev/text_${owner}.cy.ts"
output_dir="cypress/e2e/text_${owner}_dev"

echo "Owner: $owner"
echo "Original file: $orig_file"

# Ensure the output directory exists
mkdir -p $output_dir

# Read the original test file and process each 'it' block
awk '
    BEGIN {
        in_test_block = 0;
        test_content = "";
        test_name = "";
        FS="\'";
    }
    {
        print "Processing line: " $0;
    }
    /^it\(/ {
        # Extract the test name
        match($0, /it\(\047([^\047]+)\047/);  # \047 is the octal representation of a single quote
        if (RSTART) {
            test_name = substr($0, RSTART + 4, RLENGTH - 5);
            sub(/^./, tolower(substr(test_name, 1, 1)), test_name);
            gsub(" ", "_", test_name);
            gsub("\\.", "", test_name);

            print "Extracted test name: " test_name;

            # Start capturing the test block content
            in_test_block = 1;
            test_content = $0 "\n";
            next;
        }
    }
    in_test_block {
        test_content = test_content $0 "\n";
        # Check for the end of the test block
        if ($0 ~ /^\s*\}\);\s*$/) {
            in_test_block = 0;

            # Write the extracted test block to a new file
            output_file = "'$output_dir'/" test_name ".cy.ts";
            print "Writing to file: " output_file;
            print "import { owner } from \"../../../postgresConfig\";\n" > output_file;
            print "import us from \"../../../lang_us.json\";\n" >> output_file;
            print "import cz from \"../../../lang_cz.json\";\n" >> output_file;
            print "import { randomPassword, randomName } from \"../../../lib/utils\";\n" >> output_file;
            print "context(\"" test_name "\", () => {\n" >> output_file;
            print "    beforeEach(() => {\n" >> output_file;
            print "        cy.visit(\"http://localhost:3000\");\n" >> output_file;
            print "    });\n" >> output_file;
            print test_content >> output_file;
            print "});" >> output_file;
            test_content = "";
        }
    }
    END {
        if (test_content != "") {
            print "Unclosed test block detected."
        }
    }
' "$orig_file"

# Check if files were created
if [ "$(ls -A $output_dir/*.cy.ts 2>/dev/null)" ]; then
    echo "Files were created successfully."
else
    echo "No files were created."
fi

