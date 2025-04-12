#!/bin/bash

show_menu() {
  echo "========== Prisma Docker Automation =========="
  echo "1) Run migration with name"
  echo "2) Generate Prisma client"
  echo "3) Seed database"
  echo "4) Reset migrations"
  echo "5) Push schema to database"
  echo "0) Exit"
  echo "=============================================="
  echo -n "Enter your choice: "
}

get_container_name() {
  echo -n "Enter container name: "
  read container_name
  if [ -z "$container_name" ]; then
    echo "Error: Container name cannot be empty"
    return 1
  fi
  return 0
}

while true; do
  show_menu
  read choice

  case $choice in
    0)
      echo "Exiting script. Goodbye!"
      exit 0
      ;;
    1)
      echo -n "Enter migration name: "
      read migration_name
      if [ -z "$migration_name" ]; then
        echo "Error: Migration name cannot be empty"
      else
        if get_container_name; then
          echo "Running migration with name: $migration_name on container: $container_name"
          docker compose run --rm $container_name npx prisma migrate dev --name "$migration_name"
          echo "Migration complete!"
        fi
      fi
      ;;
    2)
      if get_container_name; then
        echo "Generating Prisma client on container: $container_name"
        docker compose run --rm $container_name npx prisma generate
        echo "Generation complete!"
      fi
      ;;
    3)
      if get_container_name; then
        echo "Seeding database on container: $container_name"
        docker compose run --rm $container_name npx prisma db seed
        echo "Seeding complete!"
      fi
      ;;
    4)
      if get_container_name; then
        echo "Resetting migrations on container: $container_name"
        echo -n "Are you sure you want to reset all migrations? This will delete all data. (y/n): "
        read confirm
        if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
          docker compose run --rm $container_name npx prisma migrate reset --force
          echo "Reset complete!"
        else
          echo "Reset cancelled."
        fi
      fi
      ;;
    5)
      if get_container_name; then
        echo "Pushing schema to database on container: $container_name"
        docker compose run --rm $container_name npx prisma db push
        echo "Schema push complete!"
      fi
      ;;
    *)
      echo "Invalid option. Please try again."
      ;;
  esac
  
  echo ""
  echo "Press Enter to continue..."
  read
  clear
done