import socket
import select

def run_proxy():
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server.bind(('127.0.0.1', 8888))
    server.listen(5)
    print("Proxy listening on 8888")
    while True:
        try:
            client, addr = server.accept()
            data = client.recv(4096)
            if b"CONNECT github.com:443" in data or b"CONNECT api.github.com:443" in data:
                target_ip = '140.82.114.4'
                target = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                target.connect((target_ip, 443))
                client.sendall(b"HTTP/1.1 200 Connection Established\r\n\r\n")
                
                target.setblocking(0)
                client.setblocking(0)
                
                while True:
                    r, _, _ = select.select([client, target], [], [], 1.0)
                    if client in r:
                        d = client.recv(4096)
                        if not d: break
                        target.sendall(d)
                    if target in r:
                        d = target.recv(4096)
                        if not d: break
                        client.sendall(d)
                target.close()
            client.close()
        except Exception as e:
            print("Error:", e)

if __name__ == "__main__":
    run_proxy()
