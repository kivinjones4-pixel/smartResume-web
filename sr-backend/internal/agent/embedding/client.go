package embedding

import "context"

// Client converts text into vectors in one shared semantic space.
type Client interface {
	Embed(ctx context.Context, inputs []string) ([][]float32, error)
}
