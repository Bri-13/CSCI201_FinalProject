import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;

import org.json.JSONArray;
import org.json.JSONObject;

public class RecipeSearchService {

    public static JSONArray searchRecipes(
            Connection conn,
            String query,
            String category,
            String difficulty,
            String prepTime
    ) throws Exception {

        // Normalize query
        String normalizedQuery = (query == null) ? "" : query.toLowerCase().trim();
        String likeQuery = "%" + normalizedQuery + "%";

        StringBuilder sql = new StringBuilder(
            "SELECT *, " +
            "(" +
            " (CASE WHEN LOWER(recipe_name) LIKE ? THEN 5 ELSE 0 END) +" +     // title weight
            " (CASE WHEN LOWER(category) LIKE ? THEN 4 ELSE 0 END) +" +        // tag/category weight
            " (CASE WHEN LOWER(ingredients) LIKE ? THEN 3 ELSE 0 END) +" +     // ingredients weight
            " (CASE WHEN LOWER(instructions) LIKE ? THEN 1 ELSE 0 END)" +      // instructions weight
            ") AS score " +
            "FROM Recipes WHERE 1=1"
        );

        ArrayList<Object> params = new ArrayList<>();

        // Add scoring params (must match order above)
        params.add(likeQuery);
        params.add(likeQuery);
        params.add(likeQuery);
        params.add(likeQuery);

        // Require at least some match if query exists
        if (!normalizedQuery.isEmpty()) {
            sql.append(" AND (LOWER(recipe_name) LIKE ? OR LOWER(ingredients) LIKE ?)");
            params.add(likeQuery);
            params.add(likeQuery);
        }

        // Category filter
        if (category != null && !category.equalsIgnoreCase("All")) {
            sql.append(" AND category = ?");
            params.add(category);
        }

        // Difficulty filter
        if (difficulty != null && !difficulty.equalsIgnoreCase("All")) {
            sql.append(" AND difficulty = ?");
            params.add(difficulty);
        }

        // Prep time filter
        if (prepTime != null) {
            switch (prepTime) {
                case "20":
                    sql.append(" AND prep_time <= 20");
                    break;
                case "40":
                    sql.append(" AND prep_time <= 40");
                    break;
                case "40+":
                    sql.append(" AND prep_time > 40");
                    break;
            }
        }

        // Sort by relevance score (main feature)
        sql.append(" ORDER BY score DESC, created_at DESC");

        PreparedStatement stmt = conn.prepareStatement(sql.toString());

        // Set all parameters safely
        for (int i = 0; i < params.size(); i++) {
            stmt.setObject(i + 1, params.get(i));
        }

        ResultSet rs = stmt.executeQuery();
        JSONArray recipes = new JSONArray();

        while (rs.next()) {
            JSONObject recipe = recipeToJson(rs);
            recipe.put("score", rs.getInt("score")); // optional debug
            recipes.put(recipe);
        }

        return recipes;
    }

    // Convert DB row → JSON
    private static JSONObject recipeToJson(ResultSet rs) throws Exception {
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