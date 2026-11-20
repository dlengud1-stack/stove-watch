"""Generate Korean display text with a local CPU model. The articles never go to a translation API."""
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile
from urllib.request import Request, urlopen
import venv

BASE = "https://huggingface.co/gn64/M2M100_418M_CTranslate2/resolve/main/"
MODEL_HASH = "a1826980fc5c037e69c7ac94fcb56c03001a66f380eb71863cc0a3879e71421b"
CACHE = Path(os.environ.get("STOVE_MODEL_DIR") or Path.home() / ".cache" / "stovewatch" / "m2m100-v1")
PACKAGES = ["ctranslate2==4.6.0", "sentencepiece==0.2.1", "langid==1.1.6"]


def runtime():
    env = CACHE / "venv"
    python = env / ("Scripts/python.exe" if os.name == "nt" else "bin/python")
    marker = env / ".ready-4.6"
    if not marker.exists():
        venv.EnvBuilder(with_pip=True).create(env)
        subprocess.run([str(python), "-m", "pip", "install", "--disable-pip-version-check", *PACKAGES],
                       check=True, stdout=sys.stderr)
        marker.touch()
    return python


def model_files():
    target = CACHE / "model"
    target.mkdir(parents=True, exist_ok=True)
    for name in ("config.json", "shared_vocabulary.json", "sentencepiece.bpe.model", "model.bin"):
        dest = target / name
        if dest.exists():
            continue
        with tempfile.NamedTemporaryFile(dir=target, delete=False) as temp:
            part = Path(temp.name)
        try:
            req = Request(BASE + name, headers={"User-Agent": "StoveWatch-LCK/1.0"})
            with urlopen(req, timeout=70) as response, part.open("wb") as out:
                shutil.copyfileobj(response, out, length=1024 * 1024)
            if name == "model.bin":
                checksum=hashlib.sha256()
                with part.open("rb") as data:
                    for chunk in iter(lambda: data.read(1024 * 1024), b""):
                        checksum.update(chunk)
                digest=checksum.hexdigest()
                if digest != MODEL_HASH:
                    raise ValueError("Unexpected model checksum")
            os.replace(part, dest)
        finally:
            part.unlink(missing_ok=True)
    return target


def source_language(text, detect):
    if re.search(r"[\u3040-\u30ff]", text):
        return "ja"
    if re.search(r"[\u3400-\u9fff]", text):
        return "zh"
    if re.search(r"[ăơưđạ-ỹ]", text, re.I):
        return "vi"
    return detect(text)[0]


def translate(texts):
    import ctranslate2
    import langid
    import sentencepiece as spm

    folder = model_files()
    engine = ctranslate2.Translator(str(folder), device="cpu", compute_type="int8", intra_threads=3)
    tokenizer = spm.SentencePieceProcessor(model_file=str(folder / "sentencepiece.bpe.model"))
    langs = ["en","fr","es","de","pt","it","vi","id","tr","ru","uk","pl","nl","th","ar","tl","sv","zh","ja"]
    langid.set_languages(langs)
    for i in range(0, len(texts), 8):
        part = texts[i:i+8]
        sources = [["__" + source_language(text, langid.classify) + "__"] + tokenizer.encode(text, out_type=str) + ["</s>"] for text in part]
        results = engine.translate_batch(sources, target_prefix=[["__ko__"] for _ in part], beam_size=3,
                                         repetition_penalty=1.15, max_decoding_length=200, max_input_length=350)
        for raw, result in zip(part, results):
            pieces = [p for p in result.hypotheses[0] if p not in ("__ko__", "</s>", "<s>")]
            korean = tokenizer.decode(pieces).strip()
            if korean != raw and re.search("[가-힣]", korean):
                print(json.dumps([raw,korean], ensure_ascii=False), flush=True)


if __name__ == "__main__":
    if "--worker" in sys.argv:
        translate(json.load(sys.stdin))
    else:
        CACHE.mkdir(parents=True, exist_ok=True)
        python = runtime()
        os.execv(str(python), [str(python), str(Path(__file__).resolve()), "--worker"])

