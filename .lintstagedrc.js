module.exports = {
  "*.ts": [
    "eslint --fix",
    "git add"
  ],
  "*.{ts,js,json,md}": [
    "prettier --write",
    "git add"
  ]
};