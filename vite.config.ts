import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const dbUrl =
    env.VITE_DATABASE_URL ||
    env.DATABASE_URL ||
    'postgresql://neondb_owner:npg_pVIt5wu6ejyJ@ep-winter-lake-aysbswet-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require'

  return {
    plugins: [react()],
    define: {
      'import.meta.env.VITE_DATABASE_URL': JSON.stringify(dbUrl),
    },
  }
})
