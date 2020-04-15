module.exports = {
	up: function up(queryInterface, Sequelize) {
		return queryInterface.changeColumn('sessions', 'user_type', {
			type: Sequelize.STRING,
			allowNull: false
		}).then(() => {
			const pgEnumDropQuery = queryInterface.QueryGenerator.pgEnumDrop('sessions', 'user_type');

			return queryInterface.sequelize.query(pgEnumDropQuery);
		}).then(() => {
			return queryInterface.changeColumn('sessions', 'user_type', {
				type: Sequelize.ENUM('customer', 'delivery_agent', 'admin'),
				allowNull: false
			});
		}).then(() => {
			return queryInterface.sequelize.query("ALTER TABLE sessions DROP CONSTRAINT sessions_user_id_fkey;");
		})
	},
	down: function down(queryInterface, Sequelize) {
		return queryInterface.changeColumn('sessions', 'user_type', {
			type: Sequelize.STRING,
			allowNull: false
		}).then(() => {
			const pgEnumDropQuery = queryInterface.QueryGenerator.pgEnumDrop('sessions', 'user_type');

			return queryInterface.sequelize.query(pgEnumDropQuery);
		}).then(() => {
			return queryInterface.changeColumn('sessions', 'user_type', {
				type: Sequelize.ENUM('customer', 'delivery_agent'),
				allowNull: false
			});
		});
	}
};
