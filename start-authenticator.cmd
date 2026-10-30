@echo off
setlocal
if not defined AUTHENTICATOR_PORT set AUTHENTICATOR_PORT=8798
"%~dp0one-authenticator.exe" --listen "127.0.0.1:%AUTHENTICATOR_PORT%" %*
