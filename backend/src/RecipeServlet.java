import java.io.BufferedReader;
import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;

import org.json.JSONArray;
import org.json.JSONObject;

import jakarta.servlet.*;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

@WebServlet("/RecipeServlet")
public class RecipeServlet extends HttpServlet {

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

            if ("getRecipe".equals(action)) {
                int recipeId = Integer.parseInt(request.getParameter("recipe_id"));
                PreparedStatement stmt = conn.prepareStatement(
                        "SELECT * FROM Recipes WHERE recipe_id = ?");
                stmt.setInt(1, recipeId);
                ResultSet rs = stmt.executeQuery();

                if (rs.next()) {
                    res.put("success", true);
                    res.put("recipe", recipeResultToJson(rs));
                } else {
                    res.put("success", false);
                    res.put("message", "Recipe not found");
                }

            } else if ("getAllRecipes".equals(action)) {
                PreparedStatement stmt = conn.prepareStatement(
                        "SELECT * FROM Recipes ORDER BY created_at DESC");
                ResultSet rs = stmt.executeQuery();
                JSONArray recipes = new JSONArray();

                while (rs.next()) {
                    recipes.put(recipeResultToJson(rs));
                }

                res.put("success", true);
                res.put("recipes", recipes);

            } else if ("getUserRecipes".equals(action)) {
                int userId = Integer.parseInt(request.getParameter("user_id"));
                PreparedStatement stmt = conn.prepareStatement(
                        "SELECT * FROM Recipes WHERE user_id = ? ORDER BY created_at DESC");
                stmt.setInt(1, userId);
                ResultSet rs = stmt.executeQuery();
                JSONArray recipes = new JSONArray();

                while (rs.next()) {
                    recipes.put(recipeResultToJson(rs));
                }

                res.put("success", true);
                res.put("recipes", recipes);

            }
            // Search recipes with filters
            else if ("searchRecipes".equals(action)) {

                String query = request.getParameter("query");
                String category = request.getParameter("category");
                String difficulty = request.getParameter("difficulty");
                String prepTime = request.getParameter("prep_time");

                JSONArray recipes = RecipeSearchService.searchRecipes(
                        conn, query, category, difficulty, prepTime
                );

                res.put("success", true);
                res.put("recipes", recipes);
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

                if ("addRecipe".equals(action)) {
                    String validationMessage = validateRecipeInput(req, false);
                    if (validationMessage != null) {
                        res.put("success", false);
                        res.put("message", validationMessage);
                        response.getWriter().print(res.toString());
                        return;
                    }

                    PreparedStatement stmt = conn.prepareStatement(
                            "INSERT INTO Recipes (user_id, recipe_name, ingredients, instructions, prep_time, cook_time, difficulty, category, photo_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                            Statement.RETURN_GENERATED_KEYS);
                    stmt.setInt(1, req.getInt("user_id"));
                    stmt.setString(2, req.getString("recipe_name").trim());
                    stmt.setString(3, req.getString("ingredients").trim());
                    stmt.setString(4, req.getString("instructions").trim());
                    stmt.setInt(5, req.optInt("prep_time", 0));
                    stmt.setInt(6, req.optInt("cook_time", 0));
                    stmt.setString(7, req.optString("difficulty", ""));
                    stmt.setString(8, req.optString("category", ""));
                    stmt.setString(9, req.optString("photo_url", ""));
                    stmt.executeUpdate();

                    ResultSet keys = stmt.getGeneratedKeys();
                    if (keys.next()) {
                        res.put("recipe_id", keys.getInt(1));
                    }
                    res.put("success", true);
                    res.put("message", "Recipe added successfully");

                } else if ("updateRecipe".equals(action)) {
                    String validationMessage = validateRecipeInput(req, true);
                    if (validationMessage != null) {
                        res.put("success", false);
                        res.put("message", validationMessage);
                        response.getWriter().print(res.toString());
                        return;
                    }

                    int recipeId = req.getInt("recipe_id");
                    int userId = req.getInt("user_id");

                    PreparedStatement ownerCheck = conn.prepareStatement(
                            "SELECT * FROM Recipes WHERE recipe_id = ? AND user_id = ?");
                    ownerCheck.setInt(1, recipeId);
                    ownerCheck.setInt(2, userId);
                    ResultSet ownerRs = ownerCheck.executeQuery();

                    if (!ownerRs.next()) {
                        res.put("success", false);
                        res.put("message", "You can only edit your own recipes");
                    } else {
                        PreparedStatement stmt = conn.prepareStatement(
                                "UPDATE Recipes SET recipe_name = ?, ingredients = ?, instructions = ?, prep_time = ?, cook_time = ?, difficulty = ?, category = ?, photo_url = ? WHERE recipe_id = ?");
                        stmt.setString(1, req.getString("recipe_name").trim());
                        stmt.setString(2, req.getString("ingredients").trim());
                        stmt.setString(3, req.getString("instructions").trim());
                        stmt.setInt(4, req.optInt("prep_time", 0));
                        stmt.setInt(5, req.optInt("cook_time", 0));
                        stmt.setString(6, req.optString("difficulty", ""));
                        stmt.setString(7, req.optString("category", ""));
                        stmt.setString(8, req.optString("photo_url", ""));
                        stmt.setInt(9, recipeId);
                        stmt.executeUpdate();

                        res.put("success", true);
                        res.put("message", "Recipe updated successfully");
                    }

                } else if ("deleteRecipe".equals(action)) {
                    int recipeId = req.optInt("recipe_id", -1);
                    int userId = req.optInt("user_id", -1);

                    if (recipeId <= 0 || userId <= 0) {
                        res.put("success", false);
                        res.put("message", "Missing recipe_id or user_id");
                        response.getWriter().print(res.toString());
                        return;
                    }

                    PreparedStatement ownerCheck = conn.prepareStatement(
                            "SELECT * FROM Recipes WHERE recipe_id = ? AND user_id = ?");
                    ownerCheck.setInt(1, recipeId);
                    ownerCheck.setInt(2, userId);
                    ResultSet ownerRs = ownerCheck.executeQuery();

                    if (!ownerRs.next()) {
                        res.put("success", false);
                        res.put("message", "You can only delete your own recipes");
                    } else {
                        PreparedStatement stmt = conn.prepareStatement(
                                "DELETE FROM Recipes WHERE recipe_id = ?");
                        stmt.setInt(1, recipeId);
                        stmt.executeUpdate();

                        res.put("success", true);
                        res.put("message", "Recipe deleted successfully");
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

    private void setCorsHeaders(HttpServletResponse response) {
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "Content-Type");
        response.setContentType("application/json");
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

    private String validateRecipeInput(JSONObject req, boolean requiresRecipeId) {
        if (requiresRecipeId && req.optInt("recipe_id", -1) <= 0) {
            return "Valid recipe_id is required";
        }
        if (req.optInt("user_id", -1) <= 0) {
            return "Valid user_id is required";
        }
        if (req.optString("recipe_name", "").trim().isEmpty()) {
            return "Recipe name is required";
        }
        if (req.optString("ingredients", "").trim().isEmpty()) {
            return "Ingredients are required";
        }
        if (req.optString("instructions", "").trim().isEmpty()) {
            return "Instructions are required";
        }
        if (req.has("prep_time") && req.optInt("prep_time", -1) < 0) {
            return "Prep time must be a non-negative integer";
        }
        if (req.has("cook_time") && req.optInt("cook_time", -1) < 0) {
            return "Cook time must be a non-negative integer";
        }
        if (req.optString("recipe_name", "").length() > 255) {
            return "Recipe name exceeds max length";
        }
        return null;
    }

    private JSONObject recipeResultToJson(ResultSet rs) throws Exception {
        JSONObject recipe = new JSONObject();
        recipe.put("recipe_id", rs.getInt("recipe_id"));
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
