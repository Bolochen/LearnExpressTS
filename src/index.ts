import { logger } from './utils/logger'
import createServer from './utils/server'

// connect DB
import './utils/connectDB'

const app = createServer()
const port: number = 4000

app.listen(port, () => {
  logger.info(`Server is listening on port ${port}`)
})
