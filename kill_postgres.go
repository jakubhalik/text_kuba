package main

import (
	"fmt"
	"os/exec"
	"strings"
)

func main() {
	fmt.Println("Starting PostgreSQL uninstallation process")

	commands := []struct {
		desc    string
		command []string
	}{
		{"Stopping PostgreSQL service", []string{"sudo", "systemctl", "stop", "postgresql"}},
		{"Disabling PostgreSQL service", []string{"sudo", "systemctl", "disable", "postgresql"}},
		{"Uninstalling PostgreSQL", []string{"sudo", "pacman", "-Rns", "postgresql"}},
		{"Removing PostgreSQL directories", []string{"sudo", "rm", "-rf", "/var/lib/postgres", "/etc/postgresql"}},
		{"Deleting postgres user", []string{"sudo", "userdel", "-r", "postgres"}},
		{"Cleaning up orphaned packages", []string{"sudo", "pacman", "-Rns", "$(pacman -Qtdq)"}},
	}

	for _, cmd := range commands {
		fmt.Printf("Executing: %s\n", cmd.desc)
		err := exec.Command(cmd.command[0], cmd.command[1:]...).Run()
		if err != nil {
			fmt.Printf("Error executing %s: %v\n", cmd.desc, err)
		} else {
			fmt.Printf("Successfully executed: %s\n", cmd.desc)
		}
	}

	removePaths := []string{
		"/usr/share/locale/ka/LC_MESSAGES/", "/usr/share/locale/ko/LC_MESSAGES/",
		"/usr/share/locale/nb/LC_MESSAGES/", "/usr/share/locale/pl/LC_MESSAGES/",
		"/usr/share/locale/pt_BR/LC_MESSAGES/", "/usr/share/locale/ro/LC_MESSAGES/",
		"/usr/share/locale/ru/LC_MESSAGES/", "/usr/share/locale/sv/LC_MESSAGES/",
		"/usr/share/locale/ta/LC_MESSAGES/", "/usr/share/locale/tr/LC_MESSAGES/",
		"/usr/share/locale/uk/LC_MESSAGES/", "/usr/share/locale/vi/LC_MESSAGES/",
		"/usr/share/locale/zh_CN/LC_MESSAGES/", "/usr/share/locale/zh_TW/LC_MESSAGES/",
		"/usr/share/locale/cs/LC_MESSAGES/", "/usr/share/locale/de/LC_MESSAGES/",
		"/usr/share/locale/el/LC_MESSAGES/", "/usr/share/locale/es/LC_MESSAGES/",
		"/usr/share/locale/fr/LC_MESSAGES/", "/usr/share/locale/he/LC_MESSAGES/",
		"/usr/share/locale/it/LC_MESSAGES/", "/usr/share/locale/ja/LC_MESSAGES/",
		"/usr/share/man/man1/", "/usr/bin/", "/usr/include/", "/usr/lib/",
	}

	localeFiles := []string{
		"ecpg-16.mo", "ecpglib6-16.mo", "libpq5-16.mo", "pg_config-16.mo",
		"pg_dump-16.mo", "pgscripts-16.mo", "psql-16.mo", "clusterdb.1.gz",
		"createdb.1.gz", "createuser.1.gz", "dropdb.1.gz", "dropuser.1.gz",
		"pg_dumpall.1.gz", "pg_isready.1.gz", "pg_restore.1.gz", "reindexdb.1.gz",
		"vacuumdb.1.gz", "ecpg", "pg_config", "pg_dump", "pg_dumpall",
		"pg_isready", "pg_restore", "psql", "reindexdb", "vacuumdb",
		"ecpg_config.h", "ecpg_informix.h", "ecpgerrno.h", "ecpglib.h",
		"ecpgtype.h", "libpq-events.h", "libpq-fe.h", "libpq/libpq-fs.h",
		"pg_config.h", "pg_config_ext.h", "pg_config_manual.h", "pg_config_os.h",
		"pgtypes.h", "pgtypes_date.h", "pgtypes_error.h", "pgtypes_interval.h",
		"pgtypes_numeric.h", "pgtypes_timestamp.h", "postgres_ext.h",
		"sql3types.h", "sqlca.h", "sqlda-compat.h", "sqlda-native.h", "sqlda.h",
		"libecpg.so", "libecpg.so.6", "libecpg.so.6.16", "libecpg_compat.so",
		"libecpg_compat.so.3", "libecpg_compat.so.3.16", "libpgtypes.so",
		"libpgtypes.so.3", "libpgtypes.so.3.16", "libpq.so", "libpq.so.5",
		"libpq.so.5.16", "libecpg.pc", "libecpg_compat.pc", "libpgtypes.pc", "libpq.pc",
	}

	var filesToRemove []string

	for _, path := range removePaths {
		for _, file := range localeFiles {
			filesToRemove = append(filesToRemove, strings.TrimSpace(path+file))
		}
	}

	fmt.Println("Batch removing files")
	cmdStr := "sudo rm -rf " + strings.Join(filesToRemove, " ")
	err := exec.Command("bash", "-c", cmdStr).Run()
	if err != nil {
		fmt.Printf("Error removing files: %v\n", err)
	} else {
		fmt.Println("Successfully removed all files")
	}

	fmt.Println("PostgreSQL uninstallation process completed")
}

