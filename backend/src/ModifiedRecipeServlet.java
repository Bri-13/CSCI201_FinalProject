import java.io.*;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import jakarta.servlet.annotation.WebServlet;
import java.sql.*;
import org.json.JSONArray;
import org.json.JSONObject;

@WebServlet("/ModifiedRecipeServlet")
public class ModifiedRecipeServlet extends HttpServlet {

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

                if ("createModifiedRecipe".equals(action)) {
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
