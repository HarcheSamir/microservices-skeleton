find . -type f ! -path "*/node_modules/*" ! -name "package-lock.json" -exec sh -c '
for f; do
  echo -e "\033[1;34m\n===== FILE: $f =====\033[0m"
  cat "$f"
done
' _ {} +
