import db from '../../config/db.js';


const createDefaultTiers = async () => {
  try {
    const defaultTiers = [
      {
        tier_key: 'Free',
        tier_name: 'Free Tier',
        tier_order: 0,
        threshold_text: 'Default Entry Level',
        min_turnover: 0,
        commission_percent: 0,
        payment_cycle: 'Monthly',
        priority_listing: false,
        color_code: '#64748b',
        badge_color: '#f8fafc', 
        features: [
          'Basic support',
          'No commission',
          'Limited portal access',
          'Monthly payments'
        ]
      },
      {
        tier_key: 'silver',
        tier_name: 'Silver Tier',
        tier_order: 1,
        threshold_text: 'Default Entry Level',
        min_turnover: 0,
        commission_percent: 18,
        payment_cycle: 'Monthly',
        priority_listing: false,
        color_code: '#475569',
        badge_color: '#f1f5f9',
        features: [
          'Standard support',
          'Regular commission (20%)',
          'Basic portal analytics',
          'Monthly payments'
        ]
      },
      {
        tier_key: 'gold',
        tier_name: 'Gold Tier',
        tier_order: 2,
        threshold_text: 'Turnover > 5000 / Month',
        min_turnover: 5000,
        commission_percent: 15,
        payment_cycle: 'Bi-Weekly',
        priority_listing: true,
        color_code: '#b45309',
        badge_color: '#fef3c7',
        features: [
          'Regular marketing support',
          'Standard commission (15%)',
          'Priority dispatch',
          'Bi-weekly payments'
        ]
      },
      {
        tier_key: 'platinum',
        tier_name: 'Platinum Tier',
        tier_order: 3,
        threshold_text: 'Turnover > 10000 / Month',
        min_turnover: 10000,
        commission_percent: 12,
        payment_cycle: 'Weekly',
        priority_listing: true,
        color_code: '#4f46e5',
        badge_color: '#e0e7ff',
        features: [
          'Priority customer support',
          'Reduced commission (12%)',
          'Free marketing shoutouts',
          'Top listing in search results'
        ]
      }
    ];

    for (const tier of defaultTiers) {
      const [rows] = await db.query(
        `SELECT id FROM tiers WHERE tier_key = ?`,
        [tier.tier_key]
      );

      if (rows.length === 0) {
        await db.query(
          `INSERT INTO tiers
          (tier_key, tier_name, tier_order, threshold_text, min_turnover,
           commission_percent, payment_cycle, priority_listing,
           color_code, badge_color, features)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            tier.tier_key,
            tier.tier_name,
            tier.tier_order,
            tier.threshold_text,
            tier.min_turnover,
            tier.commission_percent,
            tier.payment_cycle,
            tier.priority_listing,
            tier.color_code,
            tier.badge_color,
            JSON.stringify(tier.features)
          ]
        );

        console.log(`${tier.tier_key} tier created`);
      }
    }

  } catch (error) {
    console.log("Error creating default tiers:", error.message);
  }
};


/* ===============================
   CREATE TIER
================================= */
const createTier = async (data) => {
  try {
    const {
      tier_key,
      tier_name,
      tier_order,
      threshold_text,
      min_turnover,
      commission_percent,
      payment_cycle,
      priority_listing,
      color_code,
      badge_color,
      features
    } = data;

    const query = `
      INSERT INTO tiers
      (tier_key, tier_name, tier_order, threshold_text, min_turnover,
       commission_percent, payment_cycle, priority_listing,
       color_code, badge_color, features)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.query(query, [
      tier_key,
      tier_name,
      tier_order,
      threshold_text,
      min_turnover,
      commission_percent,
      payment_cycle,
      priority_listing,
      color_code,
      badge_color,
      JSON.stringify(features || [])
    ]);

    return { id: result.insertId };

  } catch (error) {
    throw new Error(error.message);
  }
};


/* ===============================
   GET TIERS
================================= */
const getTiers = async () => {
  try {

    // Create default tiers if empty
    await createDefaultTiers();

    const [rows] = await db.query(`
      SELECT *
      FROM tiers
      ORDER BY tier_order ASC
    `);

    return rows;

  } catch (error) {
    throw new Error(error.message);
  }
};


/* ===============================
   UPDATE TIER
================================= */
const updateTier = async (id, data) => {
  try {
    const query = `
      UPDATE tiers SET
        tier_name = ?,
        tier_order = ?,
        threshold_text = ?,
        min_turnover = ?,
        commission_percent = ?,
        payment_cycle = ?,
        priority_listing = ?,
        color_code = ?,
        badge_color = ?,
        features = ?
      WHERE id = ?
    `;

    await db.query(query, [
      data.tier_name,
      data.tier_order,
      data.threshold_text,
      data.min_turnover,
      data.commission_percent,
      data.payment_cycle,
      data.priority_listing,
      data.color_code,
      data.badge_color,
      JSON.stringify(data.features || []),
      id
    ]);

    return { id };

  } catch (error) {
    throw new Error(error.message);
  }
};


/* ===============================
   DELETE TIER
================================= */
const deleteTier = async (id) => {
  try {
    await db.query(`DELETE FROM tiers WHERE id = ?`, [id]);
    return { id };

  } catch (error) {
    throw new Error(error.message);
  }
};




export default {
  createTier,
  getTiers,
  updateTier,
  deleteTier
};