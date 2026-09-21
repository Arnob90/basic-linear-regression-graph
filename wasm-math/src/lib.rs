use linrow::{matrix::Matrix, row::Row, utils::conjugate_transpose};
use wasm_bindgen::prelude::*;
#[wasm_bindgen]
pub struct FitResult {
    pub m: f64,
    pub b: f64,
}

#[wasm_bindgen]
pub fn least_squares(points: &[f64]) -> Result<FitResult, JsError> {
    if points.len() < 4 || !points.len().is_multiple_of(2) {
        return Err(JsError::new(
            "Expected at least 2 points as flattened [x0, y0, x1, y1, ...]",
        ));
    }

    let n = points.len() / 2;
    let mut rows = Vec::with_capacity(n);
    let mut y_values = Vec::with_capacity(n);

    for chunk in points.chunks_exact(2) {
        rows.push(Row::new(vec![chunk[0], 1.0]));
        y_values.push(chunk[1]);
    }

    let req_matrix = Matrix::from_rows(rows)
        .map_err(|e| JsError::new(&format!("Failed to build matrix: {:?}", e)))?;

    let conj = conjugate_transpose(&req_matrix);
    let mut pseudoinverse_intermediate = &conj * &req_matrix;
    pseudoinverse_intermediate
        .invert()
        .map_err(|_| JsError::new("Matrix is singular (points may lie on a vertical line)"))?;

    let pseudoinverse = pseudoinverse_intermediate * conj;
    let y_vec = Row::new(y_values);
    let slope_intercept = pseudoinverse * y_vec;

    Ok(FitResult {
        m: slope_intercept.row_elems[0],
        b: slope_intercept.row_elems[1],
    })
}
