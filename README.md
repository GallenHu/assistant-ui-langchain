## RAG

```sh
wget https://raw.githubusercontent.com/mynane/PDF/master/Shell%20%E6%95%99%E7%A8%8B%20-%20v1.0.pdf -O test.pdf
npm run dev
```

```
curl -X "POST" "http://127.0.0.1:3000/api/rag" \
     -H 'Content-Type: application/json; charset=utf-8' \
     -d $'{
  "question": "shell 与编译型语言的差异"
}'
```