import urllib.request, json

BASE = "http://localhost:8000"
for path, name in [("/health","Health"), ("/api/regression/train","Regression"), ("/api/classification/train","Classification"), ("/api/clustering/train","Clustering")]:
    try:
        data = json.loads(urllib.request.urlopen(BASE+path, timeout=30).read())
        if path == "/health":
            print(f"OK {name}: {data}")
        else:
            print(f"OK {name}: {len(data['logs'])} logs, {len(data['metrics'])} models, best={data['best_model']}")
    except Exception as e:
        print(f"FAIL {name}: {e}")
