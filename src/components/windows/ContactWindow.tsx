import { useMutation } from "convex/react";
import type { RefObject } from "react";
import { useState } from "react";
import Button from "@/components/Button";
import Window from "@/components/Window";
import { useWindowManager } from "@/contexts/WindowManagerContext";
import { api } from "../../../convex/_generated/api";

export function ContactWindow({
	parentRef,
}: {
	parentRef: RefObject<HTMLDivElement | null>;
}) {
	const { isOpen, close } = useWindowManager();
	const [formData, setFormData] = useState({
		name: "",
		email: "",
		message: "",
	});
	const [submitted, setSubmitted] = useState(false);
	const [loading, setLoading] = useState(false);
	const submitContactForm = useMutation(api.contact.submitContactForm);

	if (!isOpen("contact")) return null;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		await submitContactForm(formData);
		setSubmitted(true);
		setLoading(false);
		setFormData({ name: "", email: "", message: "" });
	};

	return (
		<Window
			open={true}
			title="ContactMe.app"
			subtitle="Get in touch"
			windowId="contact"
			content={
				<div>
					<p>If you'd like to get in touch, use the contact form below:</p>
					<form className="mt-4" onSubmit={handleSubmit}>
						<div className="mb-4">
							<label className="block text-sm font-medium mb-1" htmlFor="name">
								Name:
							</label>
							<input
								value={formData.name}
								required
								onChange={(e) =>
									setFormData({ ...formData, name: e.target.value })
								}
								type="text"
								id="name"
								className="w-full p-2 border border-sky-600 rounded bg-slate-800 text-white"
							/>
						</div>
						<div className="mb-4">
							<label className="block text-sm font-medium mb-1" htmlFor="email">
								Email:
							</label>
							<input
								type="email"
								id="email"
								required
								className="w-full p-2 border border-sky-600 rounded bg-slate-800 text-white"
								value={formData.email}
								onChange={(e) =>
									setFormData({ ...formData, email: e.target.value })
								}
							/>
						</div>
						<div className="mb-4">
							<label
								className="block text-sm font-medium mb-1"
								htmlFor="message"
							>
								Message:
							</label>
							<textarea
								id="message"
								rows={4}
								required
								className="w-full p-2 border border-sky-600 rounded bg-slate-800 text-white"
								value={formData.message}
								onChange={(e) =>
									setFormData({ ...formData, message: e.target.value })
								}
							/>
						</div>
						<Button isLoading={loading}>Send</Button>
					</form>
					{submitted && (
						<p className="mt-4 text-green-400 font-semibold">
							Thank you for reaching out! I'll get back to you soon.
						</p>
					)}
				</div>
			}
			handler={() => close("contact")}
			parentRef={parentRef}
		/>
	);
}
