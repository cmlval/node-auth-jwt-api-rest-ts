import { Request, Response } from "express";
import { comparePasswords, hashPassword } from "../services/password.service";
import prisma from "../models/user";
import { generateToken } from "../services/auth.service";
import { error } from "console";

export const register = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  try {
    const hashedPassword = await hashPassword(password);
    console.log(hashedPassword);

    const user = await prisma.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    const token = generateToken(user);
    res.status(201).json({ token });
  } catch (error: any) {
    if (!email) {
      res.status(400).json({ error: "el email es obligatorio" });
      return;
    }
    if (!password) {
      res.status(400).json({ error: "el password es obligatorio" });
      return;
    }
    if (error?.code === "P2002" && error?.meta?.target?.includes("email")) {
      res.status(400).json({ error: "el email ingresado ya existe" });
      return;
    }
    console.log(error);
    res.status(500).json({ error: "Hubo un error en el registro" });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  try {
    const user = await prisma.findUnique({ where: { email } });
    if (!user) {
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }

    const passWordMatch = await comparePasswords(password, user.password);
    if (!passWordMatch) {
      res.status(401).json({ error: "usuario y contraseña no coinciden" });
    }
    const token = generateToken(user);
    res.status(200).json({ token });
  } catch (error) {
    if (!email) {
      res.status(400).json({ error: "el email es obligatorio" });
    }
    if (!password) {
      res.status(400).json({ error: "el password es obligatorio" });
    }

    console.log(error);
  }
};
