import { Injectable } from '@angular/core';
import { CapacitorSQLite, SQLiteDBConnection, SQLiteConnection } from '@capacitor-community/sqlite';
import { Storage } from '@ionic/storage-angular';
import { Capacitor } from '@capacitor/core';


@Injectable({
  providedIn: 'root'
})
export class DbTaskService {

  private connection!: SQLiteDBConnection;

  constructor(private storage: Storage) { }

  async init() {
    if (this.connection) return;

    const sqlite = new SQLiteConnection(CapacitorSQLite);

    if (Capacitor.isNativePlatform()) {
      this.connection = await sqlite.createConnection(
        'skeleton.db', false, 'no-encryption', 1, false
      );
      await this.connection.open();
      await this.createTables();
    }

    else if (customElements.get('jeep-sqlite')) {
      this.connection = await sqlite.createConnection(
        'skeleton',
        false, 'no-encryption', 1, false
      );
      await this.connection.open();
    
      await this.createTables();
    }

    /* ───────────── fallback: Storage solo ───────────── */
    await this.storage.create();
  }


  private async createTables() {
    await this.connection.execute(`
      CREATE TABLE IF NOT EXISTS sesion_data (
        user_name TEXT(8) PRIMARY KEY NOT NULL,
        password INTEGER NOT NULL,
        active INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS datos_personales (
        id INTEGER PRIMARY KEY CHECK (id=1),     -- solo un registro
        nombre TEXT NOT NULL,
        apellido  TEXT NOT NULL,
        educacion TEXT NOT NULL,
        fnac TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS experiencia (
        id INTEGER  PRIMARY KEY AUTOINCREMENT,
        empresa TEXT NOT NULL,
        inicio INTEGER NOT NULL,
        actual INTEGER NOT NULL,
        termino INTEGER,
        cargo TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS certificados (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        fecha TEXT NOT NULL,
        vence INTEGER NOT NULL,
        vencimiento TEXT
      );
    `);
  }

  /**
   * Verificamos si hay una sesión activa.
   * Esto se hace consultando la tabla `sesion_data`
   * y comprobando si hay al menos un registro con `active = 1`.
   * @returns 
   */
  async sesionActiva() {
    const ses = await this.storage.get('session');
    if (ses?.active) return true;

    if (this.connection) {
      const r = await this.connection.query(
        `SELECT 1 FROM sesion_data WHERE active = 1 LIMIT 1`
      );
      return !!r.values?.length;
    }

    return false;
  }

  /**
   * Validamos las credenciales del usuario.
   * Esto se hace consultando la tabla `sesion_data`
   * y comprobando si hay un registro con el nombre de usuario y contraseña proporcionados.
   * @param user Nombre de usuario
   * @param pass Contraseña del usuario
   * @returns true si las credenciales son válidas, false en caso contrario
   */
  async validarUser(user: string, pass: string) {
    if (this.connection) {
      const r = await this.connection.query(
        `SELECT 1 FROM sesion_data WHERE user_name=? AND password=?`,
        [user, pass]
      );
      return !!r.values?.length;
    }
    // En web basta con verificar que coincida lo guardado en Storage
    const ses = await this.storage.get('session');
    return ses?.user === user && ses?.password === pass;
  }

  /**
   * Validamos si el usuario ya existe en la base de datos.
   * Esto se hace consultando la tabla `sesion_data`
   * y comprobando si hay un registro con el nombre de usuario proporcionado.
   * @param user 
   * @param pass 
   */
  async registrarSesion(user: string, pass: string) {
    // Guarda en Storage (usable en web y nativo)
    await this.storage.set('session', {
      user,
      password: pass,
      active: true,
    });

    // Si estamos en plataforma nativa, además inserta en SQLite
    if (this.connection) {
      await this.connection.run(
        `INSERT OR REPLACE INTO sesion_data(user_name,password,active)
         VALUES(?,?,1)`,
        [user, pass]
      );
    }
  }

  async guardarMisDatos(datos: {
    nombre: string;
    apellido: string;
    educacion: string;
    fnac: string;
  }) {
    /* 1️⃣ SQLite nativo / jeep-sqlite */
    if (this.connection) {
      await this.connection.run(
        `INSERT OR REPLACE INTO datos_personales
         (id,nombre,apellido,educacion,fnac)
         VALUES (1,?,?,?,?)`,
        [datos.nombre, datos.apellido, datos.educacion, datos.fnac]
      );
    }
  
    /* 2️⃣ Fallback Storage (ionic serve) */
    await this.storage.set('datos_personales', datos);
  }
  
  async obtenerMisDatos() {
    if (this.connection) {
      const r = await this.connection.query(
        `SELECT nombre,apellido,educacion,fnac
         FROM datos_personales WHERE id = 1`
      );
      if (r.values?.length) return r.values[0];
    }
    return (await this.storage.get('datos_personales')) ?? null;
  }

  /**
   * Actualizamos el estado de la sesión del usuario.
   * Esto se hace actualizando el campo `active` de la tabla `sesion_data`
   * @param user 
   * @param active 
   */
  async actualizarSesion(user: string, active: 0 | 1) {
    await this.storage.set('session', { user, active: !!active });

    if (this.connection) {
      await this.connection.run(
        `UPDATE sesion_data SET active=? WHERE user_name=?`,
        [active, user]
      );
    }
  }

  /* CRUD de la Experiencia */
  async agregarExperiencia(exp: {
    empresa: string;
    inicio: number;
    actual: boolean;
    termino: number | null;
    cargo: string;
  }) {
    const { empresa, inicio, actual, termino, cargo } = exp;

    /* 1️⃣  Plataforma nativa (o jeep-sqlite en web)  */
    if (this.connection) {
      await this.connection.run(
        `INSERT INTO experiencia (empresa,inicio,actual,termino,cargo)
         VALUES (?,?,?,?,?)`,
        [empresa, inicio, +actual, termino, cargo]
      );
    }

    /* 2️⃣  Fallback para ionic serve → guardamos en Ionic Storage */
    const lista = (await this.storage.get('experiencia')) ?? [];
    lista.unshift({ empresa, inicio, actual, termino, cargo });
    await this.storage.set('experiencia', lista);
  }

  async eliminarExperiencia(id: number) {
    if (this.connection) {
      await this.connection.run(`DELETE FROM experiencia WHERE id = ?`, [id]);
    }
    const lista = (await this.storage.get('experiencia')) ?? [];
    await this.storage.set(
      'experiencia',
      lista.filter((e: any) => e.id !== id)
    );
  }

  /**
   * Actualiza un registro de experiencia.
   * @param id     ID de la fila (PRIMARY KEY autoincremental)
   * @param exp    Campos a modificar. Solo los que envíes serán cambiados
   */
  async actualizarExperiencia(
    id: number,
    exp: Partial<{
      empresa: string;
      inicio: number;
      actual: boolean;
      termino: number | null;
      cargo: string;
    }>
  ) {
    /* 1️⃣  -- Plataforma nativa / jeep-sqlite (SQLite disponible) -- */
    if (this.connection) {
      // Construimos SET dinámico según las claves recibidas
      const cols = Object.keys(exp);
      const values = Object.values(exp);

      if (cols.length) {
        const setClause = cols.map(c => `${c} = ?`).join(', ');
        await this.connection.run(
          `UPDATE experiencia SET ${setClause} WHERE id = ?`,
          [...values, id]
        );
      }
    }

    /* 2️⃣  -- ionic serve  (fallback Storage) -- */
    const lista = (await this.storage.get('experiencia')) ?? [];
    const idx = lista.findIndex((e: any) => e.id === id);
    if (idx !== -1) {
      lista[idx] = { ...lista[idx], ...exp };
      await this.storage.set('experiencia', lista);
    }
  }

  /**
   * Listamos la experiencia laboral del usuario.
   * Esto se hace consultando la tabla `experiencia`
   * y ordenando los resultados por el campo `id` en orden descendente.
   * @returns 
   */
  async listaExperiencia() {
    // Si hay conexión nativa (Android/iOS o jeep-sqlite en web)  ➜ usa SQLite
    if (this.connection) {
      const r = await this.connection.query(`SELECT * FROM experiencia ORDER BY id DESC`);
      return r.values ?? [];
    }

    // Browser sin SQLite ➜ usa Storage (o devuelve array vacío)
    return (await this.storage.get('experiencia')) ?? [];
  }

  /* CURD de los certificados */
  async agregarCertificado(cert: any) {
    if (this.connection) {
      await this.connection.run(
        `INSERT INTO certificados(nombre,fecha,vence,vencimiento) VALUES(?,?,?,?)`,
        [cert.nombre, cert.fecha, +cert.vence, cert.vencimiento]
      );
    }
    const arr = (await this.storage.get('certificados')) ?? [];
    arr.unshift(cert);
    await this.storage.set('certificados', arr);
  }

  /**
   * Listamos los certificados del usuario.
   * Esto se hace consultando la tabla `certificados`
   * y ordenando los resultados por el campo `id` en orden descendente.
   * @returns 
   */
  async listaCertificado() {
    if (this.connection) {
      const r = await this.connection.query(`SELECT * FROM certificados ORDER BY id DESC`);
      return r.values ?? [];
    }
    return (await this.storage.get('certificados')) ?? [];
  }

}