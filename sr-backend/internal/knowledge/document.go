package knowledge

type Document struct {
	Title      string
	SourcePath string
	SourceURL  string
	Category   string
	Visibility string
	Status     string
	Version    int
	Body       string
	Hash       string
}

type Chunk struct {
	Index   int
	Heading string
	Content string
	Hash    string
}

type ImportStats struct {
	DocumentsScanned int
	DocumentsChanged int
	ChunksWritten    int
}
