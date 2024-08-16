package main

import (
	"bufio"
	"fmt"
	"os/exec"
	"strings"
)

func main() {
	linesGo, err := runCommand("go", "run", "count_written_lines.go")
	if err != nil {
		fmt.Printf("Error running count_written_lines.go: %v\n", err)
		return
	}

	linesSh, err := runCommand("./count_written_lines.sh")
	if err != nil {
		fmt.Printf("Error running count_written_lines.sh: %v\n", err)
		return
	}

	compareLines(linesGo, removePrefix(linesSh, "./"), "count_written_lines.go", "count_written_lines.sh")
}

func runCommand(name string, arg ...string) (map[string]bool, error) {
	cmd := exec.Command(name, arg...)
	output, err := cmd.Output()
	if err != nil {
		return nil, err
	}

	lines := make(map[string]bool)
	scanner := bufio.NewScanner(strings.NewReader(string(output)))
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line != "" {
			lines[line] = true
		}
	}

	if err := scanner.Err(); err != nil {
		return nil, err
	}

	return lines, nil
}

func removePrefix(lines map[string]bool, prefix string) map[string]bool {
	trimmedLines := make(map[string]bool)
	for line := range lines {
		trimmedLine := strings.TrimPrefix(line, prefix)
		trimmedLines[trimmedLine] = true
	}
	return trimmedLines
}

func compareLines(lines1, lines2 map[string]bool, source1, source2 string) {
	fmt.Printf("Lines unique to %s:\n", source1)
	for line := range lines1 {
		if !lines2[line] {
			fmt.Println(line)
		}
	}

	fmt.Printf("\nLines unique to %s:\n", source2)
	for line := range lines2 {
		if !lines1[line] {
			fmt.Println(line)
		}
	}
}

