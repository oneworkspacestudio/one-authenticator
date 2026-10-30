# Serve only through your existing trusted HTTPS proxy. No domain is baked in.
& "$PSScriptRoot/one-authenticator.exe" --listen 127.0.0.1:8798 --public-origin 'https://workspace.example.test'
