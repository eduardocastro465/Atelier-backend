const { Usuario } = require("../Models/UsuarioModel");
require("../Routes/UsuarioRoute");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

exports.perfilUsuario = async (req, res) => {
  try {
    const { correo } = req.params.correo;
    // Buscar el usuario por correo en la base de datos
    const usuario = await Usuario.findOne({ correo })
      .populate("municipioId.municipio")
      .populate("coloniaId.colonia");
    // Verificar si el usuario existe
    if (!usuario) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }
    // Devolver los datos del perfil del usuario
    return res.status(200).json({ datos: usuario });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensaje: "Error en el servidor" });
  }
};

// ruta de verificacion de tipo de acceso
exports.VerificaTipoRolAcceso = (req, res) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(403).json({ message: "Token no proporcionado" });
  }

  jwt.verify(token, "secret_key", (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Token inválido" });
    }

    req.user = decoded;
    next();
  });
};

// Middleware para verificar el token y el rol del usuario
exports.verifyTokenAndRole = (role) => (req, res, next) => {
  // Verificar si el usuario está autenticado
  console.log(role)
  if (!req.user) {
    return res
      .status(401)
      .json({ message: "Acceso denegado. Debes iniciar sesión." });
  }

  // Verificar si el usuario tiene el rol adecuado
  if (req.user.role !== role) {
    return res
      .status(403)
      .json({ message: `Acceso denegado. Debes ser ${role}.` });
  }

  // Si el usuario está autenticado y tiene el rol adecuado, continuar con la siguiente función
  next();
};

exports.getColoniasPorClientes = async (req, res) => {
  try {
    const clientes = await Usuario.find({ rol: { $ne: "ADMINPG" } });

    const resultado = {};

    clientes.forEach((cliente) => {
      const { municipio, colonia, nombre } = cliente;

      if (!resultado[municipio]) {
        resultado[municipio] = {};
      }

      if (!resultado[municipio][colonia]) {
        resultado[municipio][colonia] = [];
      }

      resultado[municipio][colonia].push(nombre);
    });

    res.json(resultado);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al obtener clientes agrupados", error });
  }
};
// // Ruta protegida para administradores
// exports.adminRoute = exports.verifyTokenAndRole("ADMIN");
// // Ruta protegida para clientes
// exports.clienteRoute = exports.verifyTokenAndRole("cliente");

exports.EstadoUsuario = async (req, res) => {
  try {
    const cookie = req.cookies["jwt"];
    if (!cookie) {
      return res.status(401).send({
        message: "no autentificado",
      });
    }
    const claims = jwt.verfy(cookie, "secret");
    if (!claims) {
      return res.status(401).send({
        message: "no  autentificado",
      });
    }
    const usuario = await Usuario.findOne({ _id: claims._id });
    if (!usuario) {
      return res.status(401).send({
        message: "Usuario no encontrado",
      });
    }

    const { password, ...data } = await usuario.toJSON();
    res.send(data);
  } catch (error) {
    return res.status(401).send({
      message: "no autentificado",
    });
  }
};

exports.crearUsuario = async (req, res) => {
  try {
    let nombre = req.body.nombre;
    let telefono = req.body.telefono;
    let email = req.body.email;
    let password = req.body.password;

    console.table(req.body);

    const record = await Usuario.findOne({ email: email });
    if (record) {
      return res.status(400).send({ message: "El email ya está registrado" });
    }
    // Encripta la nueva contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const usuario = new Usuario({
      nombre: nombre,
      email: email,
      telefono: telefono,
      password: hashedPassword,
    });

    const resultado = await usuario.save();

    console.log("Registro exitoso:", resultado); // Mensaje de éxito en la consola
    res.json({
      usuario: resultado._id,
      message: "exitoso",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Error en el servidor: " + error);
  }
};

exports.obtenerUsuarioById = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id);
    if (!usuario) {
      return res.status(404).json({ msg: "usuario Not Found" });
    }
    res.json(usuario);
  } catch (error) {
    console.log(error);
    res.status(404).send("ucurrio un error");
  }
};

exports.buscaUsuarioByCorreo = async (req, res) => {
  try {
    let usuario = await Usuario.findOne(
      { correo: req.params.correo },
      { _id: 1 }
    );
    if (usuario) {
      res.json({ usuarioId: usuario._id });
    } else {
      res.json({ msg: "Usuario no encontrado" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

exports.BuscaUsuarioByCorreo = async (req, res) => {
  try {
    const { correo } = req.body;

    const usuario = await Usuario.findOne({ correo });
    if (!usuario) {
      return res
        .status(404)
        .json({ message: "usuario con este correo no encontrado" });
    }
    res.json(usuario);
  } catch (error) {
    console.log(error);
    res.status(404).send("ocurrio un error");
  }
};

exports.BuscaUsuarioByToken = async (req, res) => {
  try {
    const { correo, token } = req.body;

    const usuario = await Usuario.findOne({ correo: correo, token: token });
    console.log(usuario);
    if (!usuario) {
      return res.status(404).json({ message: "usuario no encontrado" });
    }
    res.json(usuario);
  } catch (error) {
    console.log(error);
    res.status(404).send("ocurrio un error");
  }
};

exports.BuscaUsuarioByPreguntayRespuesta = async (req, res) => {
  try {
    const { pregunta, respuesta } = req.body;

    const usuario = await Usuario.findOne({
      pregunta: pregunta,
      respuesta: respuesta,
    });
    console.log(usuario);
    if (!usuario) {
      return res.status(404).json({ message: "usuario no encontrado" });
    }
    res.json(usuario);
  } catch (error) {
    console.log(error);
    res.status(404).send("ocurrio un error");
  }
};

exports.obtenerUsuarios = async (req, res) => {
  try {
    // Excluye el usuario con el rol "admin" de la consulta
    const usuarios = await Usuario.find({ rol: { $ne: "ADMIN" } });
    res.json(usuarios);
  } catch (error) {
    console.log("error de consulta");
  }
};

exports.actualizarPasswordxCorreo = async (req, res) => {
  try {
    let { correo } = req.body.correo;
    let { token } = req.body.token;
    let nuevaPassword = req.body.nueva;

    // Verificar si nuevaPassword está definido y no es una cadena vacía
    if (!nuevaPassword || typeof nuevaPassword !== "string") {
      console.log(nuevaPassword);
      return res
        .status(400)
        .json({ message: "La nueva contraseña es inválida" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(nuevaPassword, salt);

    const usuario = await Usuario.findOne({ correo: correo, token: token });

    if (!usuario) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Actualiza la contraseña del usuario en la base de datos
    usuario.password = hashedPassword;
    await usuario.save();

    // Devuelve una respuesta exitosa
    res.status(200).json({ message: "Contraseña actualizada correctamente" });
  } catch (error) {
    // Maneja los errores y devuelve una respuesta de error
    console.error(error);
    res
      .status(500)
      .json({ message: "Ocurrió un error al actualizar la contraseña" });
  }
};

exports.actualizarPasswordxPregunta = async (req, res) => {
  try {
    let { pregunta } = req.body.pregunta;
    let { respuesta } = req.body.respuesta;
    let nuevaPassword = req.body.nueva;
    console.log("pregunta=>", pregunta);
    console.log("respuesta=>", respuesta);
    console.log("nuevaPassword=>", nuevaPassword);
    // Verificar si nuevaPassword está definido y no es una cadena vacía
    if (!nuevaPassword || typeof nuevaPassword !== "string") {
      console.log(nuevaPassword);
      return res
        .status(400)
        .json({ message: "La nueva contraseña es inválida" });
    }

    // Encripta la nueva contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(nuevaPassword, salt);

    // Busca el usuario por correo y token
    const usuario = await Usuario.findOne({
      pregunta: pregunta,
      respuesta: respuesta,
    });

    // Si no se encuentra el usuario, devuelve un mensaje de error
    if (!usuario) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Actualiza la contraseña del usuario en la base de datos
    usuario.password = hashedPassword;
    await usuario.save();

    // Devuelve una respuesta exitosa
    res.status(200).json({ message: "Contraseña actualizada correctamente" });
  } catch (error) {
    // Maneja los errores y devuelve una respuesta de error
    console.error(error);
    res
      .status(500)
      .json({ message: "Ocurrió un error al actualizar la contraseña" });
  }
};
const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types.ObjectId;


exports.eliminarCliente = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id);

    if (!usuario) {
      return res.status(404).json({ msg: "No existe el Usuario" });
    }
    const clienteObjectId = usuario._id;
    const resultadoEliminacion = await exports.eliminarPuntoEntregaPorClienteId(
      clienteObjectId
    );
    await Usuario.findOneAndDelete({ _id: clienteObjectId });
    res.json({
      msg: "Usuario y puntos de entrega asociados eliminados con éxito",
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Ocurrió un error al eliminar el cliente");
  }
};

// exports.eliminarCliente = async (req, res) => {
//   try {
//     let usuario = await Usuario.findById(req.params.id);

//     if (!usuario) {
//       res.status(404).json({ msg: "No existe el Usuario" });
//     }

//     await Usuario.findOneAndDelete({ _id: req.params.id });

//     res.json({ msg: "Usuario eliminado con exito" });
//   } catch (error) {
//     console.log(error);
//     res.status(500).send("ocurrio un error");
//   }
// };

exports.listarSecretas = async (req, res) => {
  try {
    // Obtener todas las preguntas secretas
    const preguntas = await PreguntasSecretas.find();

    res.json(preguntas);
  } catch (error) {
    // Manejar errores
    console.error("Error al obtener las preguntas secretas:", error);
    res.status(500).json({ error: "Error al obtener las preguntas secretas" });
  }
};

// Ruta para actualizar el rol de un usuario
exports.actualizaRolUsuario = async (req, res) => {
  const { id } = req.params;
  const { rol } = req.body;

  try {
    // Busca y actualiza el usuario en la base de datos
    const usuarioActualizado = await Usuario.findByIdAndUpdate(
      id,
      { rol: rol },
      { new: true }
    );

    if (!usuarioActualizado) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    res.status(200).json({
      mensaje: "Rol actualizado correctamente",
      usuario: usuarioActualizado,
    });
  } catch (error) {
    console.error("Error al actualizar el rol del usuario:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

// Ruta para actualizar el rol de un usuario
exports.actualizaDatos = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, email, longitud, latitud, telefono, numCasa, estatus } =
      req.body;
    // Busca y actualiza el usuario en la base de datos
    let cliente = await Usuario.findById(req.params.id);
    if (!cliente) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    // Actualiza el usuario con los datos proporcionados en el cuerpo de la solicitud
    const usuarioActualizado = await Usuario.findByIdAndUpdate(
      id,
      { nombre, email, longitud, latitud, telefono, numCasa, estatus },
      { new: true }
    );

    console.log("Registro exitoso:"); // Mensaje de éxito en la consola

    res.status(200).json({
      mensaje: "Rol actualizado correctamente",
      usuario: usuarioActualizado,
    });
  } catch (error) {
    console.error("Error al actualizar el rol del usuario:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

// "estatus": "Activo",
// "fechaDeRegistro": "2024-05-25T00:40:33.378Z",
// "_id": "6650d1b66aba6920beec5449",
// "nombre": "Toni",
// "email": "toni.tonni@gmail.com",
// "password1": "$2a$10$rVHysM/9EGa7ZtsnHhDAy.ScW0NBuo8FyBoeKGuuyEoiptwg7xwi.",
// "longitud": "-98.52107347143587",
// "latitud": "21.18937867390761",
// "telefono": "122121212",
// "numCasa": "8",
// "rol": "cliente",
