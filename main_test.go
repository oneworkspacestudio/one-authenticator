package main

import (
	"net/http/httptest"
	"strings"
	"testing"
)

func TestPublicHostBoundary(t *testing.T) {
	for _, c := range []struct {
		method, path, host string
		status             int
	}{{"GET", "/", "localhost:8798", 200}, {"GET", "/healthz", "localhost:8798", 200}, {"POST", "/", "localhost:8798", 405}, {"GET", "/", "attacker.invalid", 403}, {"GET", "/api/secret", "localhost:8798", 404}, {"GET", "/sw.js", "localhost:8798", 200}} {
		r := httptest.NewRequest(c.method, "http://"+c.host+c.path, nil)
		w := httptest.NewRecorder()
		handler("").ServeHTTP(w, r)
		if w.Code != c.status {
			t.Fatalf("%s %s: %d", c.method, c.path, w.Code)
		}
		if c.status == 200 && !strings.Contains(w.Header().Get("Content-Security-Policy"), "frame-ancestors 'none'") {
			t.Fatal("missing security policy")
		}
	}
}
