package main

import (
	"bufio"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

func shouldSkip(path string, patterns []string) bool {
	for _, pattern := range patterns {
		if strings.Contains(path, pattern) {
			return true
		}
	}
	return false
}

func countLines(filePath string) (int, error) {
	file, err := os.Open(filePath)
	if err != nil {
		return 0, err
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	lines := 0
	for scanner.Scan() {
		lines++
	}

	return lines, scanner.Err()
}

func main() {
	dirExclusions := []string{".git", ".next", "node_modules", "public"}
	fileExclusions := []string{
		"bun.lockb", "dev.log", "dev1.log", "setup_db_bin",
		"kill_postgres_bin", "count_written_lines_bin",
	}

	var totalLines int

	err := filepath.Walk(".", func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		if info.IsDir() && shouldSkip(path, dirExclusions) {
			return filepath.SkipDir
		}

		if shouldSkip(path, fileExclusions) {
			return nil
		}

		lines, err := countLines(path)
		if err != nil {
			fmt.Printf("Error counting lines in %s: %v\n", path, err)
			return nil
		}

		fmt.Printf("%s: %d\n", path, lines)
		totalLines += lines

		return nil
	})

	if err != nil {
		fmt.Printf("Error walking the file path: %v\n", err)
	}

	fmt.Printf("Total lines in non-excluded files: %d\n", totalLines)
}

