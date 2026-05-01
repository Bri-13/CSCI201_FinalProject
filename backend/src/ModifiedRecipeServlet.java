import java.io.*;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import jakarta.servlet.annotation.WebServlet;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.sql.*;
import org.json.JSONArray;
import org.json.JSONObject;

@WebServlet("/ModifiedRecipeServlet")
public class ModifiedRecipeServlet extends HttpServlet {
    private static final String GEMINI_API_KEY = "AIzaSyCDqrnTtaJ3VYjyGxiiSwwI-gsBbrGHNGs";

    private void setCorsHeaders(HttpServletResponse response) {
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "Content-Type");
        response.setContentType("application/json");
    }

    protected void doOptions(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        setCorsHeaders(response);
        response.setStatus(HttpServletResponse.SC_OK);
    }

    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        setCorsHeaders(response);
        JSONObject res = new JSONObject();

        try (Connection conn = DBConnection.getConnection()) {
            String action = request.getParameter("action");

            if ("getModifiedRecipe".equals(action)) {
                int modifiedRecipeId = Integer.parseInt(request.getParameter("modified_recipe_id"));
                PreparedStatement stmt = conn.prepareStatement(
                        "SELECT * FROM ModifiedRecipes WHERE modified_recipe_id = ?");
                stmt.setInt(1, modifiedRecipeId);
                ResultSet rs = stmt.executeQuery();

                if (rs.next()) {
                    res.put("success", true);
                    res.put("modified_recipe", modifiedRecipeResultToJson(rs));
                } else {
                    res.put("success", false);
                    res.put("message", "Modified recipe not found");
                }

            } else if ("getUserModifiedRecipes".equals(action)) {
                int userId = Integer.parseInt(request.getParameter("user_id"));
                PreparedStatement stmt = conn.prepareStatement(
                        "SELECT * FROM ModifiedRecipes WHERE user_id = ? ORDER BY created_at DESC");
                stmt.setInt(1, userId);
                ResultSet rs = stmt.executeQuery();
                JSONArray recipes = new JSONArray();

                while (rs.next()) {
                    recipes.put(modifiedRecipeResultToJson(rs));
                }

                res.put("success", true);
                res.put("modified_recipes", recipes);

            } else {
                res.put("success", false);
                res.put("message", "Invalid action");
            }

        } catch (Exception e) {
            res.put("success", false);
            res.put("message", e.getMessage());
        }

        response.getWriter().print(res.toString());
    }

    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        setCorsHeaders(response);
        JSONObject res = new JSONObject();

        try {
            JSONObject req = readJsonBody(request);
            String action = req.optString("action", "");

            try (Connection conn = DBConnection.getConnection()) {

                if ("modifyRecipeWithAI".equals(action)) {
                    int originalRecipeId = req.optInt("original_recipe_id", -1);
                    int userId = req.optInt("user_id", -1);
                    String userPrompt = req.optString("prompt", "").trim();
                    System.out.println("[AI MODIFY] Request received: original_recipe_id=" + originalRecipeId
                            + ", user_id=" + userId + ", prompt=" + userPrompt);

                    if (originalRecipeId <= 0 || userId <= 0 || userPrompt.isEmpty()) {
                        res.put("success", false);
                        res.put("message", "original_recipe_id, user_id, and prompt are required");
                        response.getWriter().print(res.toString());
                        return;
                    }

                    PreparedStatement originalStmt = conn.prepareStatement(
                            "SELECT * FROM Recipes WHERE recipe_id = ?");
                    originalStmt.setInt(1, originalRecipeId);
                    ResultSet originalRs = originalStmt.executeQuery();

                    if (!originalRs.next()) {
                        res.put("success", false);
                        res.put("message", "Original recipe not found");
                        response.getWriter().print(res.toString());
                        return;
                    }

                    JSONObject aiModified = generateModifiedRecipeWithGemini(originalRs, userPrompt);
                    if (!aiModified.optBoolean("success", false)) {
                        res.put("success", false);
                        res.put("message", aiModified.optString("message", "Gemini modification failed"));
                        response.getWriter().print(res.toString());
                        return;
                    }

                    JSONObject modifiedData = aiModified.getJSONObject("modified_recipe");
                    String recipeName = modifiedData.optString("recipe_name", originalRs.getString("recipe_name")).trim();
                    String ingredients = modifiedData.optString("ingredients", originalRs.getString("ingredients")).trim();
                    String instructions = modifiedData.optString("instructions", originalRs.getString("instructions")).trim();
                    int prepTime = modifiedData.has("prep_time") ? modifiedData.optInt("prep_time", originalRs.getInt("prep_time")) : originalRs.getInt("prep_time");
                    int cookTime = modifiedData.has("cook_time") ? modifiedData.optInt("cook_time", originalRs.getInt("cook_time")) : originalRs.getInt("cook_time");
                    String difficulty = modifiedData.optString("difficulty", originalRs.getString("difficulty")).trim();
                    String category = modifiedData.optString("category", originalRs.getString("category")).trim();
                    String photoUrl = modifiedData.optString("photo_url", originalRs.getString("photo_url")).trim();

                    String validationMessage = validateModifiedRecipe(recipeName, ingredients, instructions, prepTime, cookTime);
                    if (validationMessage != null) {
                        res.put("success", false);
                        res.put("message", validationMessage);
                        response.getWriter().print(res.toString());
                        return;
                    }

                    PreparedStatement stmt = conn.prepareStatement(
                            "INSERT INTO ModifiedRecipes (original_recipe_id, user_id, recipe_name, ingredients, instructions, prep_time, cook_time, difficulty, category, photo_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                            Statement.RETURN_GENERATED_KEYS);
                    stmt.setInt(1, originalRecipeId);
                    stmt.setInt(2, userId);
                    stmt.setString(3, recipeName);
                    stmt.setString(4, ingredients);
                    stmt.setString(5, instructions);
                    stmt.setInt(6, prepTime);
                    stmt.setInt(7, cookTime);
                    stmt.setString(8, difficulty);
                    stmt.setString(9, category);
                    stmt.setString(10, photoUrl);
                    stmt.executeUpdate();

                    int modifiedRecipeId = -1;
                    ResultSet keys = stmt.getGeneratedKeys();
                    if (keys.next()) {
                        modifiedRecipeId = keys.getInt(1);
                    }
                    System.out.println("[AI MODIFY] Inserted modified_recipe_id=" + modifiedRecipeId);
                    logAllModifiedRecipes(conn);

                    JSONObject modifiedRecipeRes = new JSONObject();
                    modifiedRecipeRes.put("modified_recipe_id", modifiedRecipeId);
                    modifiedRecipeRes.put("original_recipe_id", originalRecipeId);
                    modifiedRecipeRes.put("user_id", userId);
                    modifiedRecipeRes.put("recipe_name", recipeName);
                    modifiedRecipeRes.put("ingredients", ingredients);
                    modifiedRecipeRes.put("instructions", instructions);
                    modifiedRecipeRes.put("prep_time", prepTime);
                    modifiedRecipeRes.put("cook_time", cookTime);
                    modifiedRecipeRes.put("difficulty", difficulty);
                    modifiedRecipeRes.put("category", category);
                    modifiedRecipeRes.put("photo_url", photoUrl);
                    modifiedRecipeRes.put("nutrition", modifiedData.getJSONObject("nutrition"));

                    res.put("success", true);
                    res.put("message", "Recipe modified with AI successfully");
                    res.put("modified_recipe", modifiedRecipeRes);

                } else if ("createModifiedRecipe".equals(action)) {
                    int originalRecipeId = req.optInt("original_recipe_id", -1);
                    int userId = req.optInt("user_id", -1);

                    if (originalRecipeId <= 0 || userId <= 0) {
                        res.put("success", false);
                        res.put("message", "Valid original_recipe_id and user_id are required");
                        response.getWriter().print(res.toString());
                        return;
                    }

                    PreparedStatement originalStmt = conn.prepareStatement(
                            "SELECT * FROM Recipes WHERE recipe_id = ?");
                    originalStmt.setInt(1, originalRecipeId);
                    ResultSet originalRs = originalStmt.executeQuery();

                    if (!originalRs.next()) {
                        res.put("success", false);
                        res.put("message", "Original recipe not found");
                        response.getWriter().print(res.toString());
                        return;
                    }

                    String recipeName = req.optString("recipe_name", originalRs.getString("recipe_name")).trim();
                    String ingredients = req.optString("ingredients", originalRs.getString("ingredients")).trim();
                    String instructions = req.optString("instructions", originalRs.getString("instructions")).trim();
                    int prepTime = req.has("prep_time") ? req.getInt("prep_time") : originalRs.getInt("prep_time");
                    int cookTime = req.has("cook_time") ? req.getInt("cook_time") : originalRs.getInt("cook_time");
                    String difficulty = req.optString("difficulty", originalRs.getString("difficulty"));
                    String category = req.optString("category", originalRs.getString("category"));
                    String photoUrl = req.optString("photo_url", originalRs.getString("photo_url"));

                    String validationMessage = validateModifiedRecipe(recipeName, ingredients, instructions, prepTime, cookTime);
                    if (validationMessage != null) {
                        res.put("success", false);
                        res.put("message", validationMessage);
                        response.getWriter().print(res.toString());
                        return;
                    }

                    PreparedStatement stmt = conn.prepareStatement(
                            "INSERT INTO ModifiedRecipes (original_recipe_id, user_id, recipe_name, ingredients, instructions, prep_time, cook_time, difficulty, category, photo_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                            Statement.RETURN_GENERATED_KEYS);
                    stmt.setInt(1, originalRecipeId);
                    stmt.setInt(2, userId);
                    stmt.setString(3, recipeName);
                    stmt.setString(4, ingredients);
                    stmt.setString(5, instructions);
                    stmt.setInt(6, prepTime);
                    stmt.setInt(7, cookTime);
                    stmt.setString(8, difficulty);
                    stmt.setString(9, category);
                    stmt.setString(10, photoUrl);
                    stmt.executeUpdate();

                    ResultSet keys = stmt.getGeneratedKeys();
                    if (keys.next()) {
                        res.put("modified_recipe_id", keys.getInt(1));
                    }
                    res.put("success", true);
                    res.put("message", "Modified recipe created successfully");

                } else if ("updateModifiedRecipe".equals(action)) {
                    int modifiedRecipeId = req.optInt("modified_recipe_id", -1);
                    int userId = req.optInt("user_id", -1);

                    if (modifiedRecipeId <= 0 || userId <= 0) {
                        res.put("success", false);
                        res.put("message", "Valid modified_recipe_id and user_id are required");
                        response.getWriter().print(res.toString());
                        return;
                    }

                    String recipeName = req.optString("recipe_name", "").trim();
                    String ingredients = req.optString("ingredients", "").trim();
                    String instructions = req.optString("instructions", "").trim();
                    int prepTime = req.optInt("prep_time", -1);
                    int cookTime = req.optInt("cook_time", -1);
                    String difficulty = req.optString("difficulty", "");
                    String category = req.optString("category", "");
                    String photoUrl = req.optString("photo_url", "");

                    String validationMessage = validateModifiedRecipe(recipeName, ingredients, instructions, prepTime, cookTime);
                    if (validationMessage != null) {
                        res.put("success", false);
                        res.put("message", validationMessage);
                        response.getWriter().print(res.toString());
                        return;
                    }

                    PreparedStatement ownerCheck = conn.prepareStatement(
                            "SELECT * FROM ModifiedRecipes WHERE modified_recipe_id = ? AND user_id = ?");
                    ownerCheck.setInt(1, modifiedRecipeId);
                    ownerCheck.setInt(2, userId);
                    ResultSet ownerRs = ownerCheck.executeQuery();

                    if (!ownerRs.next()) {
                        res.put("success", false);
                        res.put("message", "You can only edit your own modified recipes");
                    } else {
                        PreparedStatement stmt = conn.prepareStatement(
                                "UPDATE ModifiedRecipes SET recipe_name = ?, ingredients = ?, instructions = ?, prep_time = ?, cook_time = ?, difficulty = ?, category = ?, photo_url = ? WHERE modified_recipe_id = ?");
                        stmt.setString(1, recipeName);
                        stmt.setString(2, ingredients);
                        stmt.setString(3, instructions);
                        stmt.setInt(4, prepTime);
                        stmt.setInt(5, cookTime);
                        stmt.setString(6, difficulty);
                        stmt.setString(7, category);
                        stmt.setString(8, photoUrl);
                        stmt.setInt(9, modifiedRecipeId);
                        stmt.executeUpdate();

                        res.put("success", true);
                        res.put("message", "Modified recipe updated successfully");
                    }

                } else if ("deleteModifiedRecipe".equals(action)) {
                    int modifiedRecipeId = req.optInt("modified_recipe_id", -1);
                    int userId = req.optInt("user_id", -1);

                    if (modifiedRecipeId <= 0 || userId <= 0) {
                        res.put("success", false);
                        res.put("message", "Missing modified_recipe_id or user_id");
                        response.getWriter().print(res.toString());
                        return;
                    }

                    PreparedStatement ownerCheck = conn.prepareStatement(
                            "SELECT * FROM ModifiedRecipes WHERE modified_recipe_id = ? AND user_id = ?");
                    ownerCheck.setInt(1, modifiedRecipeId);
                    ownerCheck.setInt(2, userId);
                    ResultSet ownerRs = ownerCheck.executeQuery();

                    if (!ownerRs.next()) {
                        res.put("success", false);
                        res.put("message", "You can only delete your own modified recipes");
                    } else {
                        PreparedStatement stmt = conn.prepareStatement(
                                "DELETE FROM ModifiedRecipes WHERE modified_recipe_id = ?");
                        stmt.setInt(1, modifiedRecipeId);
                        stmt.executeUpdate();

                        res.put("success", true);
                        res.put("message", "Modified recipe deleted successfully");
                    }

                } else {
                    res.put("success", false);
                    res.put("message", "Invalid action");
                }
            }

        } catch (Exception e) {
            res.put("success", false);
            res.put("message", e.getMessage());
        }

        response.getWriter().print(res.toString());
    }

    private JSONObject readJsonBody(HttpServletRequest request) throws Exception {
        StringBuilder sb = new StringBuilder();
        BufferedReader reader = request.getReader();
        String line;
        while ((line = reader.readLine()) != null) {
            sb.append(line);
        }

        if (sb.length() == 0) {
            throw new Exception("Empty request");
        }
        return new JSONObject(sb.toString());
    }

    private JSONObject generateModifiedRecipeWithGemini(ResultSet originalRecipe, String userPrompt) {
        JSONObject res = new JSONObject();
        try {
            String apiKey = GEMINI_API_KEY;

            JSONObject original = new JSONObject();
            original.put("recipe_name", originalRecipe.getString("recipe_name"));
            original.put("ingredients", originalRecipe.getString("ingredients"));
            original.put("instructions", originalRecipe.getString("instructions"));
            original.put("prep_time", originalRecipe.getInt("prep_time"));
            original.put("cook_time", originalRecipe.getInt("cook_time"));
            original.put("difficulty", originalRecipe.getString("difficulty"));
            original.put("category", originalRecipe.getString("category"));
            original.put("photo_url", originalRecipe.getString("photo_url"));

            String prompt = "You are a recipe editor. Modify the recipe based on user request.\n"
                    + "Return ONLY strict JSON with keys: recipe_name, ingredients, instructions, prep_time, cook_time, difficulty, category, photo_url, nutrition.\n"
                    + "nutrition must be an object with keys: calories (number), protein (string), carbs (string), fat (string), fiber (string).\n"
                    + "ingredients and instructions must be newline-separated strings.\n"
                    + "Do not include markdown formatting or code fences.\n"
                    + "Original recipe JSON:\n"
                    + original.toString()
                    + "\nUser modification request:\n"
                    + userPrompt;

            String[] modelFallbackOrder = new String[] {"gemini-2.5-flash", "gemini-2.0-flash", "gemini-flash-latest"};
            JSONObject geminiRes = null;
            String lastError = "";
            for (String modelName : modelFallbackOrder) {
                JSONObject modelResult = callGeminiModel(apiKey, modelName, prompt);
                if (modelResult.optBoolean("success", false)) {
                    geminiRes = modelResult.getJSONObject("payload");
                    break;
                }
                lastError = modelResult.optString("message", "Unknown Gemini error");
                System.out.println("[GEMINI RETRY] model=" + modelName + " failed: " + lastError);
            }

            if (geminiRes == null) {
                res.put("success", false);
                res.put("message", "Gemini API error after retries: " + lastError);
                return res;
            }

            JSONArray candidates = geminiRes.optJSONArray("candidates");
            if (candidates == null || candidates.length() == 0) {
                res.put("success", false);
                res.put("message", "Gemini returned no candidates");
                return res;
            }

            String modelText = candidates.getJSONObject(0)
                    .getJSONObject("content")
                    .getJSONArray("parts")
                    .getJSONObject(0)
                    .optString("text", "")
                    .trim();

            String jsonText = stripCodeFences(modelText);
            JSONObject modified = new JSONObject(jsonText);
            System.out.println("[GEMINI PARSED JSON] " + modified.toString());

            if (!modified.has("nutrition") || !(modified.get("nutrition") instanceof JSONObject)) {
                JSONObject nutrition = new JSONObject();
                nutrition.put("calories", 0);
                nutrition.put("protein", "—");
                nutrition.put("carbs", "—");
                nutrition.put("fat", "—");
                nutrition.put("fiber", "—");
                modified.put("nutrition", nutrition);
            }

            res.put("success", true);
            res.put("modified_recipe", modified);
            return res;
        } catch (Exception e) {
            res.put("success", false);
            res.put("message", "AI modification failed: " + e.getMessage());
            return res;
        }
    }

    private String readStream(InputStream stream) throws IOException {
        if (stream == null) return "";
        StringBuilder sb = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(stream, StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }
        }
        return sb.toString();
    }

    private String stripCodeFences(String text) {
        String cleaned = text.trim();
        if (cleaned.startsWith("```")) {
            int firstNewline = cleaned.indexOf('\n');
            if (firstNewline >= 0) {
                cleaned = cleaned.substring(firstNewline + 1);
            }
            if (cleaned.endsWith("```")) {
                cleaned = cleaned.substring(0, cleaned.length() - 3);
            }
        }
        return cleaned.trim();
    }

    private JSONObject callGeminiModel(String apiKey, String modelName, String prompt) {
        JSONObject result = new JSONObject();
        try {
            URL url = new URL("https://generativelanguage.googleapis.com/v1beta/models/" + modelName + ":generateContent?key=" + apiKey);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
            conn.setDoOutput(true);

            JSONObject body = new JSONObject();
            JSONArray contents = new JSONArray();
            JSONObject content = new JSONObject();
            content.put("role", "user");
            JSONArray parts = new JSONArray();
            parts.put(new JSONObject().put("text", prompt));
            content.put("parts", parts);
            contents.put(content);
            body.put("contents", contents);

            try (OutputStream os = conn.getOutputStream()) {
                byte[] input = body.toString().getBytes(StandardCharsets.UTF_8);
                os.write(input, 0, input.length);
            }

            int status = conn.getResponseCode();
            InputStream stream = status >= 200 && status < 300 ? conn.getInputStream() : conn.getErrorStream();
            String responseText = readStream(stream);
            System.out.println("[GEMINI RAW RESPONSE][" + modelName + "] " + responseText);

            if (status < 200 || status >= 300) {
                result.put("success", false);
                result.put("message", "HTTP " + status + ": " + responseText);
                return result;
            }

            result.put("success", true);
            result.put("payload", new JSONObject(responseText));
            return result;
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", e.getMessage());
            return result;
        }
    }

    private void logAllModifiedRecipes(Connection conn) {
        try {
            PreparedStatement stmt = conn.prepareStatement(
                    "SELECT modified_recipe_id, original_recipe_id, user_id, recipe_name, ingredients, instructions, prep_time, cook_time, difficulty, category, photo_url, created_at FROM ModifiedRecipes ORDER BY modified_recipe_id ASC");
            ResultSet rs = stmt.executeQuery();
            System.out.println("===== ModifiedRecipes TABLE DUMP =====");
            while (rs.next()) {
                JSONObject row = new JSONObject();
                row.put("modified_recipe_id", rs.getInt("modified_recipe_id"));
                row.put("original_recipe_id", rs.getInt("original_recipe_id"));
                row.put("user_id", rs.getInt("user_id"));
                row.put("recipe_name", rs.getString("recipe_name"));
                row.put("ingredients", rs.getString("ingredients"));
                row.put("instructions", rs.getString("instructions"));
                row.put("prep_time", rs.getInt("prep_time"));
                row.put("cook_time", rs.getInt("cook_time"));
                row.put("difficulty", rs.getString("difficulty"));
                row.put("category", rs.getString("category"));
                row.put("photo_url", rs.getString("photo_url"));
                row.put("created_at", String.valueOf(rs.getTimestamp("created_at")));
                System.out.println(row.toString());
            }
            System.out.println("===== END ModifiedRecipes TABLE DUMP =====");
        } catch (Exception e) {
            System.out.println("[MODIFIED RECIPES LOG ERROR] " + e.getMessage());
        }
    }

    private String validateModifiedRecipe(String recipeName, String ingredients, String instructions, int prepTime, int cookTime) {
        if (recipeName.isEmpty()) {
            return "Recipe name is required";
        }
        if (ingredients.isEmpty()) {
            return "Ingredients are required";
        }
        if (instructions.isEmpty()) {
            return "Instructions are required";
        }
        if (prepTime < 0) {
            return "Prep time must be a non-negative integer";
        }
        if (cookTime < 0) {
            return "Cook time must be a non-negative integer";
        }
        if (recipeName.length() > 255) {
            return "Recipe name exceeds max length";
        }
        return null;
    }

    private JSONObject modifiedRecipeResultToJson(ResultSet rs) throws Exception {
        JSONObject recipe = new JSONObject();
        recipe.put("modified_recipe_id", rs.getInt("modified_recipe_id"));
        recipe.put("original_recipe_id", rs.getInt("original_recipe_id"));
        recipe.put("user_id", rs.getInt("user_id"));
        recipe.put("recipe_name", rs.getString("recipe_name"));
        recipe.put("ingredients", rs.getString("ingredients"));
        recipe.put("instructions", rs.getString("instructions"));
        recipe.put("prep_time", rs.getInt("prep_time"));
        recipe.put("cook_time", rs.getInt("cook_time"));
        recipe.put("difficulty", rs.getString("difficulty"));
        recipe.put("category", rs.getString("category"));
        recipe.put("photo_url", rs.getString("photo_url"));
        recipe.put("created_at", String.valueOf(rs.getTimestamp("created_at")));
        return recipe;
    }
}
