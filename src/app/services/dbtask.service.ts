import { Injectable } from '@angular/core';
import { CapacitorSQLite, SQLiteDBConnection, SQLiteConnection } from '@capacitor-community/sqlite';
import { Storage } from '@ionic/storage-angular';
import { Capacitor } from '@capacitor/core';
import { Certificado } from '../models/certificado.model';


@Injectable({
  providedIn: 'root'
})
export class DbTaskService {

  private connection!: SQLiteDBConnection;

  constructor(private storage: Storage) { }

  /**
   * Inicializamos la conexion a la base de datos de SQLite
   * y creamos las tablas necesarias de la aplicacion.
   * Si estamos en una plataforma web usaremos Ionic Storage.
   */
  async inicioDB() {
    if (this.connection) return;

    const sqlite = new SQLiteConnection(CapacitorSQLite);

    if (Capacitor.isNativePlatform()) {
      this.connection = await sqlite.createConnection(
        'skeleton.db', false, 'no-encryption', 1, false
      );
      await this.connection.open();
      await this.crearTablas();
    }
    
    /**
     * En pagina web o ionic server usamos Ionic Storage
     * para guardar los datos de sesión y otros datos simples.
     */
    await this.storage.create();
  }

  /**
   * Creamos las tablas necesarias para la aplicacion.
   * Como dato importante "sesion_data" almacenara los datos de sesion del usuario.
   */
  private async crearTablas() {
    await this.connection.execute(`
      CREATE TABLE IF NOT EXISTS sesion_data (
        user_name TEXT(8) PRIMARY KEY NOT NULL,
        password INTEGER NOT NULL,
        active INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS datos_personales (
        user_name TEXT(8) PRIMARY KEY REFERENCES sesion_data(user_name) ON DELETE CASCADE,
        nombre TEXT NOT NULL,
        apellido  TEXT NOT NULL,
        educacion TEXT NOT NULL,
        fnac TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS experiencia (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_name TEXT(8) NOT NULL REFERENCES sesion_data(user_name) ON DELETE CASCADE,
        empresa TEXT NOT NULL,
        inicio INTEGER NOT NULL,
        actual INTEGER NOT NULL,
        termino INTEGER,
        cargo TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS certificados (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_name TEXT(8) NOT NULL REFERENCES sesion_data(user_name) ON DELETE CASCADE,
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
  async validarUsuario(user: string, pass: string) {
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

  /**
   * Recupera el nombre de usuario actual.
   * Esto se hace consultando la clave `session` en Storage
   * o la tabla de "sesion_data" si estamos en nativo.
   * @returns Nombre de usuario o null si no hay sesión activa
   */
  async usuarioActual(): Promise<string | null> {
    const ses = await this.storage.get('session');
    return ses?.user ?? null;
  }

  /**
   * Guarda los datos personales del usuario.
   * Esto se hace insertando o actualizando en la tabla "datos_personales"
   * y también guardando en Storage para compatibilidad web.
   * @param datos Objeto con los datos personales
   */
  async guardarMisDatos(datos: {
    nombre: string;
    apellido: string;
    educacion: string;
    fnac: string;
  }) {
    const user = await this.usuarioActual();
    if (!user) return;

    if (this.connection) {
      await this.connection.run(
        `INSERT OR REPLACE INTO datos_personales (user_name,nombre,apellido,educacion,fnac) VALUES (?,?,?,?,?)`,
        [user, datos.nombre, datos.apellido, datos.educacion, datos.fnac]
      );
    }
    await this.storage.set(`datos_personales_${user}`, datos);
  }

  /**
   * Recuperamos todos los datos personales del usuario.
   * Esto se hace consultando la tabla "datos_personales" o Storage.
   * @returns Objeto con los datos personales o null si no hay datos
   */
  async obtenerMisDatos() {
    const user = await this.usuarioActual();
    if (!user) return null;

    if (this.connection) {
      const r = await this.connection.query(
        `SELECT nombre,apellido,educacion,fnac FROM datos_personales WHERE user_name = ?`, [user]);
      if (r.values?.length) return r.values[0];
    }
    return await this.storage.get(`datos_personales_${user}`);
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
    const user = await this.usuarioActual();
    if (!user) return;

    if (this.connection) {
      await this.connection.run(
        `INSERT INTO experiencia (user_name,empresa,inicio,actual,termino,cargo) VALUES (?,?,?,?,?,?)`,
        [user, exp.empresa, exp.inicio, +exp.actual, exp.termino, exp.cargo]
      );
    }
    const lst = (await this.storage.get(`exp_${user}`)) ?? [];
    lst.unshift({ ...exp });
    await this.storage.set(`exp_${user}`, lst);
  }

  /**
   * Elimina un registro de experiencia laboral.
   * Esto se hace eliminando el registro de la tabla `experiencia`
   * y actualizando la lista en Storage.
   * @param id ID del registro a eliminar
   */
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
   * @param id ID de la fila (PRIMARY KEY autoincremental)
   * @param exp Campos a modificar. Solo los que envíes serán cambiados
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
    if (this.connection) {
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
    // Actualizamos en Storage
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
    const user = await this.usuarioActual();
    if (!user) return [];

    if (this.connection) {
      const r = await this.connection.query(
        `SELECT * FROM experiencia WHERE user_name = ? ORDER BY id DESC`, [user]);
      return r.values ?? [];
    }
    return (await this.storage.get(`exp_${user}`)) ?? [];
  }

  /* CURD de los certificados */
  async agregarCertificado(cert: Certificado) {
    const user = await this.usuarioActual();
    if (!user) return;
  
    if (this.connection) {
      await this.connection.run(
        `INSERT INTO certificados
         (user_name,nombre,fecha,vence,vencimiento)
         VALUES (?,?,?,?,?)`,
        [user, cert.nombre, cert.fecha, +cert.vence, cert.vencimiento]
      );
    }
    const arr = (await this.storage.get(`cert_${user}`)) ?? [];
    arr.unshift(cert);
    await this.storage.set(`cert_${user}`, arr);
  }

  /**
   * Listamos los certificados del usuario.
   * Esto se hace consultando la tabla `certificados`
   * y ordenando los resultados por el campo `id` en orden descendente.
   * @returns 
   */
  async listaCertificado() {
    const user = await this.usuarioActual();
    if (!user) return [];
  
    if (this.connection) {
      const r = await this.connection.query(
        `SELECT * FROM certificados
         WHERE user_name = ?
         ORDER BY id DESC`, [user]);
      return r.values ?? [];
    }
    return (await this.storage.get(`cert_${user}`)) ?? [];
  }
}