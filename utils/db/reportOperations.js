const { query } = require('./connection');

async function createReport(reportData) {
  try {
    const sql = `
      INSERT INTO reports (guildId, adminId, adminTag, description, photo1Url, photo2Url, messageId, channelId)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      reportData.guildId,
      reportData.adminId,
      reportData.adminTag,
      reportData.description,
      reportData.photo1Url,
      reportData.photo2Url,
      reportData.messageId || null,
      reportData.channelId || null,
    ];

    const result = await query(sql, params);
    console.log(`[BD] Reporte creado: ID ${result.insertId}`);
    return result.insertId;
  } catch (error) {
    console.error('[ERROR] Error creando reporte:', error);
    throw error;
  }
}

async function getReportById(reportId) {
  try {
    const sql = 'SELECT * FROM reports WHERE id = ? AND isDeleted = FALSE';
    const results = await query(sql, [reportId]);
    return results.length > 0 ? results[0] : null;
  } catch (error) {
    console.error('[ERROR] Error obteniendo reporte:', error);
    throw error;
  }
}

async function getReportsByGuild(guildId, limit = 50) {
  try {
    const sql = `
      SELECT * FROM reports 
      WHERE guildId = ? AND isDeleted = FALSE
      ORDER BY createdAt DESC
      LIMIT ?
    `;
    return await query(sql, [guildId, limit]);
  } catch (error) {
    console.error('[ERROR] Error obteniendo reportes del servidor:', error);
    throw error;
  }
}

async function getReportsByAdmin(adminId, guildId = null, limit = 50) {
  try {
    let sql = `
      SELECT * FROM reports 
      WHERE adminId = ? AND isDeleted = FALSE
    `;
    const params = [adminId];

    if (guildId) {
      sql += ' AND guildId = ?';
      params.push(guildId);
    }

    sql += ' ORDER BY createdAt DESC LIMIT ?';
    params.push(limit);

    return await query(sql, params);
  } catch (error) {
    console.error('[ERROR] Error obteniendo reportes del admin:', error);
    throw error;
  }
}

async function countReportsByGuild(guildId) {
  try {
    const sql = 'SELECT COUNT(*) as count FROM reports WHERE guildId = ? AND isDeleted = FALSE';
    const results = await query(sql, [guildId]);
    return results[0].count;
  } catch (error) {
    console.error('[ERROR] Error contando reportes del servidor:', error);
    throw error;
  }
}

async function countReportsByAdmin(adminId, guildId = null) {
  try {
    let sql = 'SELECT COUNT(*) as count FROM reports WHERE adminId = ? AND isDeleted = FALSE';
    const params = [adminId];

    if (guildId) {
      sql += ' AND guildId = ?';
      params.push(guildId);
    }

    const results = await query(sql, params);
    return results[0].count;
  } catch (error) {
    console.error('[ERROR] Error contando reportes del admin:', error);
    throw error;
  }
}

async function updateReport(reportId, updateData) {
  try {
    const allowedFields = ['description', 'photo1Url', 'photo2Url'];
    const updates = [];
    const params = [];

    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key)) {
        updates.push(`${key} = ?`);
        params.push(value);
      }
    }

    if (updates.length === 0) return false;

    params.push(reportId);
    const sql = `UPDATE reports SET ${updates.join(', ')} WHERE id = ? AND isDeleted = FALSE`;
    await query(sql, params);

    console.log(`[BD] Reporte ${reportId} actualizado`);
    return true;
  } catch (error) {
    console.error('[ERROR] Error actualizando reporte:', error);
    throw error;
  }
}

async function deleteReport(reportId) {
  try {
    const sql = 'UPDATE reports SET isDeleted = TRUE WHERE id = ?';
    await query(sql, [reportId]);
    console.log(`[BD] Reporte ${reportId} eliminado (soft delete)`);
    return true;
  } catch (error) {
    console.error('[ERROR] Error eliminando reporte:', error);
    throw error;
  }
}

async function getReportMessageInfo(reportId) {
  try {
    const sql = 'SELECT messageId, channelId FROM reports WHERE id = ? AND isDeleted = FALSE';
    const results = await query(sql, [reportId]);
    return results.length > 0 ? results[0] : null;
  } catch (error) {
    console.error('[ERROR] Error obteniendo info del mensaje:', error);
    throw error;
  }
}

async function updateReportMessageInfo(reportId, messageId, channelId) {
  try {
    const sql = 'UPDATE reports SET messageId = ?, channelId = ? WHERE id = ?';
    await query(sql, [messageId, channelId, reportId]);
    return true;
  } catch (error) {
    console.error('[ERROR] Error actualizando info del mensaje:', error);
    throw error;
  }
}

module.exports = {
  createReport,
  getReportById,
  getReportsByGuild,
  getReportsByAdmin,
  countReportsByGuild,
  countReportsByAdmin,
  updateReport,
  deleteReport,
  getReportMessageInfo,
  updateReportMessageInfo,
};