import { config } from 'dotenv'

// Explicit process variables take precedence, then .env.local, then .env.
config({ path: ['.env.local', '.env'], quiet: true })
