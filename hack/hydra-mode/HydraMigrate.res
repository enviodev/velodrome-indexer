
let sql = Postgres.makeSql(~config=Config.db->Obj.magic /* TODO: make this have the correct type */)

let migrate = async () => {
    let _ = await %raw("sql`
       CREATE EXTENSION IF NOT EXISTS columnar;
    `")
      Js.log("created extension, now creating table")

    await Migrations.runUpMigrations(~shouldExit=false)
}

