"use strict";

var mysql = require("mysql");
var config = require('./config');

var pool = mysql.createPool({
    host: config.dbHost,
    user: config.dbUser,
    password: config.dbPassword,
    database: config.dbName
});


function getUserByEmail(email, callback) {
    if (callback === undefined) callback = function() {};
    pool.getConnection(function(err, conexion) {
        if (err) {
            callback(err);
        } else {
            conexion.query("SELECT * " +
                "FROM usuarios u " +
                "WHERE u.correo = ?", [email],
                function(err, result) {
                    conexion.release();
                    if (err) {
                        callback(err);
                    } else if (typeof result[0] === "undefined") {
                        callback(null, undefined);
                    } else {
                        callback(null, result[0]);
                    }
                });
        }
    });
};


function altaUsuario(usuario, callback) {
    if (callback === undefined) callback = function() {};
    getUserByEmail(usuario.email, function(err, ret) {
        if (typeof ret === "undefined") {
            pool.getConnection(function(err, conexion) {
                if (err) {
                    callback(err);
                } else {
                    conexion.query("INSERT INTO `usuarios` (`correo`, `contraseña`, `nombre`, `apellidos`, `sexo`, `fecha_nacimiento`) " +
                        " VALUES (?, ?, ?, ?, ?, ?);", [
                            usuario.email,
                            usuario.password,
                            usuario.nombre,
                            usuario.apellidos,
                            usuario.sexo,
                            usuario.fechaDeNacimiento
                        ],
                        function(err, result) {
                            if (err) {
                                callback(err);
                            }
                            conexion.release();
                            callback(null, usuario);
                        });
                }
            });
        } else {
            callback(null, undefined);
        }
    });

};

function getHorariosUsuario(correo, callback) {
    var dao_curso = require("./dao_curso");
}

module.exports = {
    getUserByEmail: getUserByEmail,
    altaUsuario: altaUsuario
};
