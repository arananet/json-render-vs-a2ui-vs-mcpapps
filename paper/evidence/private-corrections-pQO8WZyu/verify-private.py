import hashlib, json, pathlib, subprocess, tarfile, tempfile

root = pathlib.Path.cwd()
archive = root / 'paper/private-review.tar.gz'
sha = lambda data: hashlib.sha256(data).hexdigest()
with tempfile.TemporaryDirectory(prefix='private-paper-extraction-') as temporary:
    extracted = pathlib.Path(temporary)
    with tarfile.open(archive) as package:
        members = package.getmembers()
        for member in members:
            path = pathlib.PurePosixPath(member.name)
            assert member.isfile() and not path.is_absolute() and '..' not in path.parts, member.name
        package.extractall(extracted)
    manifest = json.loads((extracted / 'PRIVATE-MANIFEST.json').read_text())
    assert sorted(m.name for m in members) == sorted(['PRIVATE-MANIFEST.json'] + [entry['path'] for entry in manifest['files']])
    for entry in manifest['files']:
        data = (extracted / entry['path']).read_bytes()
        assert len(data) == entry['bytes']
        assert sha(data) == entry['sha256'] == sha((root / entry['path']).read_bytes()), entry['path']
        print(entry['sha256'], entry['path'])
    subprocess.run(['node', 'scripts/paper.mjs', 'check'], cwd=extracted, check=True)
    print('Verified payloads:', len(manifest['files']))
    print('Archive SHA256:', sha(archive.read_bytes()))
    print('Archive bytes:', archive.stat().st_size)
    print('Local extraction and freshness only; no independent reproduction.')
