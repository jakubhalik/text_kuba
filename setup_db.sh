#!/bin/bash

# Ask for the user's name/alias
read -p "Enter your name/alias: " username
read -sp "Enter password for the 'postgres' user: " postgres_password
echo
read -sp "Enter password for '${username}' user: " user_password
echo

# Detect OS and install PostgreSQL if not installed
install_postgresql() {
    if [ -f /etc/debian_version ]; then
        echo "Detected Debian-based system."
        sudo apt update
        sudo apt install -y postgresql
    elif [ -f /etc/arch-release ]; then
        echo "Detected Arch-based system."
        sudo pacman -Sy --noconfirm postgresql
    else
        echo "Unsupported OS. Please use Debian-based or Arch-based system."
        exit 1
    fi
}

# Check if PostgreSQL is installed
if ! command -v psql > /dev/null; then
    echo "PostgreSQL is not installed. Installing..."
    install_postgresql
else
    echo "PostgreSQL is already installed."
fi

# Initialize and start PostgreSQL service on Arch Linux
if [ -f /etc/arch-release ]; then
    sudo -u postgres initdb --locale en_US.UTF-8 -D /var/lib/postgres/data
    sudo systemctl enable postgresql
    sudo systemctl start postgresql
fi

# Start PostgreSQL service on Debian-based systems
if [ -f /etc/debian_version ]; then
    sudo service postgresql start
fi

# Detect PostgreSQL data directory
if [ -f /etc/debian_version ]; then
    PGDATA=$(sudo -u postgres PGPASSWORD=$postgres_password psql -t -P format=unaligned -c "SHOW data_directory;")
elif [ -f /etc/arch-release ]; then
    PGDATA="/var/lib/postgres/data"
else
    echo "Unsupported OS. Please use Debian-based or Arch-based system."
    exit 1
fi

# Set password for the postgres user
sudo -u postgres PGPASSWORD=$postgres_password psql -c "ALTER USER postgres PASSWORD '$postgres_password';"

# Generate SSL certificates
SSL_DIR="$PGDATA/ssl"
sudo mkdir -p $SSL_DIR
sudo openssl req -new -x509 -days 365 -nodes -out $SSL_DIR/server.crt -keyout $SSL_DIR/server.key -subj "/C=US/ST=State/L=City/O=Organization/OU=Unit/CN=localhost"
sudo chown postgres:postgres $SSL_DIR/server.crt $SSL_DIR/server.key
sudo chmod 600 $SSL_DIR/server.key

# Secure pg_hba.conf
PG_HBA="$PGDATA/pg_hba.conf"
sudo cp $PG_HBA ${PG_HBA}.bak  # Backup original file

sudo tee $PG_HBA > /dev/null <<EOF
# "local" is for Unix domain socket connections only
local   all             all                                     scram-sha-256

# IPv4 local connections:
host    all             all             127.0.0.1/32            scram-sha-256

# IPv6 local connections:
host    all             all             ::1/128                 scram-sha-256

# Allow connections from trusted IP range
host    all             all             192.168.1.0/24          scram-sha-256

# Reject other connections
host    all             all             0.0.0.0/0               reject
EOF

# Secure postgresql.conf
PG_CONF="$PGDATA/postgresql.conf"
sudo cp $PG_CONF ${PG_CONF}.bak  # Backup original file

sudo tee -a $PG_CONF > /dev/null <<EOF

# Connection settings
listen_addresses = 'localhost'  # change to '*' to allow remote connections
port = 5432

# SSL settings
ssl = on
ssl_cert_file = '$SSL_DIR/server.crt'
ssl_key_file = '$SSL_DIR/server.key'

# Resource limits
max_connections = 100
shared_buffers = 128MB
work_mem = 4MB

# Security and Authentication
password_encryption = scram-sha-256

# Logging settings
logging_collector = on
log_directory = 'pg_log'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_statement = 'all'
log_min_duration_statement = 1000  # log queries that take longer than 1 second
EOF

# Restart PostgreSQL to apply changes
if [ -f /etc/debian_version ]; then
    sudo service postgresql restart
elif [ -f /etc/arch-release ]; then
    sudo systemctl restart postgresql
fi

# Set up database and users
sudo -u postgres PGPASSWORD=$postgres_password psql <<EOF
-- Drop database if it exists
DROP DATABASE IF EXISTS text_${username};

-- Create database
CREATE DATABASE text_${username};

-- Create roles
DO
\$do\$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${username}') THEN
      CREATE ROLE ${username} WITH LOGIN;
   END IF;
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'user') THEN
      CREATE ROLE "user" WITH LOGIN;
   END IF;
END
\$do\$;
EOF

# Ask for password for the user
read -sp "Enter password for '${username}' user: " user_password
echo

# Create user with the specified password
sudo -u postgres PGPASSWORD=$postgres_password psql -c "ALTER ROLE ${username} WITH PASSWORD '$user_password';"

# Generate combined password
combined_password="${username}${user_password}"

# Hash the combined password (SHA-256)
hashed_password=$(echo -n "$combined_password" | sha256sum | awk '{print $1}')

# Enable pgcrypto extension in the new database
sudo -u postgres PGPASSWORD=$postgres_password psql -d text_${username} -c "CREATE EXTENSION pgcrypto;"

# Create encrypted tables in the user's database
sudo -u postgres PGPASSWORD=$postgres_password psql -d text_${username} <<EOF
-- Create schema
CREATE SCHEMA "${username}_schema" AUTHORIZATION "${username}";

-- Grant necessary privileges to the schema
GRANT USAGE ON SCHEMA "${username}_schema" TO ${username};

CREATE TABLE "${username}_schema"."messages_table" (
    datetime_from TIMESTAMPTZ,
    send_by TEXT,
    send_to TEXT,
    text TEXT
);

CREATE TABLE "${username}_schema"."profile_table" (
    name TEXT,
    email TEXT,
    phone_number TEXT,
    avatar BYTEA,
    theology TEXT,
    philosophy TEXT
);

-- Insert initial data into profile table
INSERT INTO "${username}_schema"."profile_table" (name) VALUES ('${username}');

-- Encrypt table data
UPDATE "${username}_schema"."profile_table" SET
    name = pgp_sym_encrypt(name::text, '$hashed_password'),
    email = pgp_sym_encrypt(email::text, '$hashed_password'),
    phone_number = pgp_sym_encrypt(phone_number::text, '$hashed_password'),
    avatar = pgp_sym_encrypt(encode(avatar, 'hex'), '$hashed_password'),
    theology = pgp_sym_encrypt(theology::text, '$hashed_password'),
    philosophy = pgp_sym_encrypt(philosophy::text, '$hashed_password');

UPDATE "${username}_schema"."messages_table" SET
    send_by = pgp_sym_encrypt(send_by::text, '$hashed_password'),
    send_to = pgp_sym_encrypt(send_to::text, '$hashed_password'),
    text = pgp_sym_encrypt(text::text, '$hashed_password');

ALTER TABLE kuba_schema.messages_table OWNER TO ${username};
ALTER TABLE kuba_schema.profile_table OWNER TO ${username};
GRANT ALL PRIVILEGES ON TABLE kuba_schema.messages_table TO ${username};
GRANT ALL PRIVILEGES ON TABLE kuba_schema.profile_table TO ${username};

EOF

# Create system user if it doesn't exist
if ! id -u $username > /dev/null 2>&1; then
    sudo useradd -m $username
fi

echo "Script execution completed."

