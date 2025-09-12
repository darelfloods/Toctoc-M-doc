@echo off
echo Testing n8n webhook with test URL...
echo.

echo Testing with prompt format:
curl -X POST "http://localhost:5678/webhook-test/659daf74-ca15-40e2-a52c-54054db41de6" ^
  -H "Content-Type: application/json" ^
  -d "{\"prompt\": \"quel est l'alternatif de Paracetamol\"}"

echo.
echo.

echo Testing with message format:
curl -X POST "http://localhost:5678/webhook-test/659daf74-ca15-40e2-a52c-54054db41de6" ^
  -H "Content-Type: application/json" ^
  -d "{\"message\": \"quel est l'alternatif de Paracetamol\"}"

echo.
echo.
echo Test completed!
pause