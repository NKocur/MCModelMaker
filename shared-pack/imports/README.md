# Optional Blocksmith imports

Place additional Blocksmith resource-pack exports here before building the shared pack.

Accepted layouts:

- An unpacked `assets/<namespace>/...` tree inside this directory.
- ZIP files containing either `assets/...` or `resource-pack/assets/...`.

The assembler does not silently overwrite another producer. A conflicting path fails the build so the collision can be resolved explicitly without changing an existing runtime model identifier.
