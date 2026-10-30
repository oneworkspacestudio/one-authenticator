package main

import (
	"embed"
	"flag"
	"fmt"
	"io/fs"
	"log"
	"net"
	"net/http"
	"net/url"
	"strings"
	"time"
)

//go:embed web/dist
var assets embed.FS
var version = "0.1.0-dev"

func handler(origin string) http.Handler {
	root, _ := fs.Sub(assets, "web/dist")
	files := http.FileServer(http.FS(root))
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		host, _, err := net.SplitHostPort(r.Host)
		if err != nil {
			host = r.Host
		}
		allowed := host == "localhost" || host == "127.0.0.1" || host == "[::1]"
		if origin != "" {
			u, _ := url.Parse(origin)
			allowed = allowed || r.Host == u.Host
		}
		if !allowed {
			http.Error(w, "invalid host", http.StatusForbidden)
			return
		}
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("Referrer-Policy", "no-referrer")
		w.Header().Set("X-Frame-Options", "DENY")
		w.Header().Set("Content-Security-Policy", "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self'; img-src 'self' data:; connect-src 'self'; media-src 'self' blob:; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'none'")
		w.Header().Set("Permissions-Policy", "camera=(self), microphone=(), geolocation=()")
		w.Header().Set("Cache-Control", "no-cache")
		if r.Method != "GET" && r.Method != "HEAD" {
			http.Error(w, "method not allowed", 405)
			return
		}
		if r.URL.Path == "/healthz" || r.URL.Path == "/version" {
			w.Header().Set("Content-Type", "application/json")
			fmt.Fprintf(w, `{"status":"ok","app":"one-authenticator","version":%q}`, version)
			return
		}
		if strings.HasPrefix(r.URL.Path, "/assets/") {
			w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
		}
		if strings.HasSuffix(r.URL.Path, "/sw.js") {
			w.Header().Set("Cache-Control", "no-store")
		}
		if r.URL.Path == "/index.html" {
			body, err := fs.ReadFile(root, "index.html")
			if err != nil {
				http.NotFound(w, r)
				return
			}
			w.Header().Set("Content-Type", "text/html; charset=utf-8")
			w.Write(body)
			return
		}
		files.ServeHTTP(w, r)
	})
}
func main() {
	listen := flag.String("listen", "127.0.0.1:8798", "Loopback listener behind the Workspace HTTPS proxy")
	origin := flag.String("public-origin", "", "Optional trusted HTTPS origin (no path)")
	show := flag.Bool("version", false, "Print version")
	flag.Parse()
	if *show {
		fmt.Println(version)
		return
	}
	host, _, err := net.SplitHostPort(*listen)
	if err != nil {
		log.Fatal("invalid listener")
	}
	ip := net.ParseIP(host)
	if ip == nil || !ip.IsLoopback() {
		log.Fatal("listen must be a loopback IP; use the trusted HTTPS reverse proxy")
	}
	if *origin != "" {
		u, e := url.Parse(*origin)
		if e != nil {
			log.Fatal("invalid public-origin")
		}
		localHTTP := u.Scheme == "http" && (u.Hostname() == "localhost" || u.Hostname() == "127.0.0.1" || u.Hostname() == "::1")
		if (!localHTTP && u.Scheme != "https") || u.Host == "" || u.Path != "" || u.User != nil || u.RawQuery != "" || u.Fragment != "" {
			log.Fatal("public-origin must be an HTTPS origin (or loopback HTTP) without credentials or path")
		}
	}
	server := http.Server{Addr: *listen, Handler: handler(*origin), ReadHeaderTimeout: 5 * time.Second, ReadTimeout: 15 * time.Second, WriteTimeout: 30 * time.Second, IdleTimeout: 60 * time.Second}
	log.Printf("One Authenticator %s listening on %s", version, *listen)
	log.Fatal(server.ListenAndServe())
}
