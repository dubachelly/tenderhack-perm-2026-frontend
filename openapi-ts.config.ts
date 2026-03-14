import { defaultPlugins } from "@hey-api/openapi-ts"

export default {
  input: "http://localhost:3000/docs/swagger.json",
  output: "src/shared/api/autogen",
  plugins: [...defaultPlugins, "@tanstack/react-query"],
}
