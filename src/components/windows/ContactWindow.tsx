import { useMutation } from "convex/react";
import { ArrowUpRight, Check, LoaderCircle, Mail } from "lucide-react";
import { type RefObject, useState } from "react";
import Window from "@/components/Window";
import { api } from "../../../convex/_generated/api";

export function ContactWindow({
	parentRef,
}: {
	parentRef: RefObject<HTMLDivElement | null>;
}) {
	const [formData, setFormData] = useState({
		name: "",
		email: "",
		message: "",
	});
	const [submitted, setSubmitted] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const submitContactForm = useMutation(api.contact.submitContactForm);
	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		if (loading) return;
		setLoading(true);
		setError("");
		try {
			await submitContactForm(formData);
			setSubmitted(true);
			setFormData({ name: "", email: "", message: "" });
		} catch {
			setError("Your message couldn't be sent. Please try again in a moment.");
		} finally {
			setLoading(false);
		}
	};
	return (
		<Window
			title="Mail"
			windowId="contact"
			parentRef={parentRef}
			content={
				<div className="contact-content">
					<div className="contact-symbol">
						<Mail size={26} />
					</div>
					<div className="eyebrow">LET'S CONNECT</div>
					<h1>
						Good things start
						<br />
						with a hello<span>.</span>
					</h1>
					<p>
						Have an idea, a question, or just want to chat?
						<br />
						I'd love to hear from you.
					</p>
					{submitted ? (
						<div className="contact-success" aria-live="polite">
							<Check size={28} />
							<h2>Message delivered.</h2>
							<p>Thanks for stopping by. I'll get back to you soon.</p>
							<button
								type="button"
								className="secondary-button"
								onClick={() => setSubmitted(false)}
							>
								Write another message
							</button>
						</div>
					) : (
						<form onSubmit={handleSubmit} className="contact-form">
							<div className="contact-fields">
								<label>
									Your name
									<input
										name="name"
										autoComplete="name"
										required
										value={formData.name}
										onChange={(event) =>
											setFormData({ ...formData, name: event.target.value })
										}
										placeholder="Alex"
									/>
								</label>
								<label>
									Email address
									<input
										name="email"
										type="email"
										autoComplete="email"
										required
										value={formData.email}
										onChange={(event) =>
											setFormData({ ...formData, email: event.target.value })
										}
										placeholder="alex@example.com"
									/>
								</label>
							</div>
							<label>
								What's on your mind?
								<textarea
									name="message"
									required
									rows={4}
									value={formData.message}
									onChange={(event) =>
										setFormData({ ...formData, message: event.target.value })
									}
									placeholder="Hey Cris, I was thinking…"
								/>
							</label>
							{error && (
								<p role="alert" className="inline-error">
									{error}
								</p>
							)}
							<button
								type="submit"
								className="primary-button"
								disabled={loading}
							>
								{loading ? (
									<>
										<LoaderCircle size={16} className="animate-spin" />
										Sending…
									</>
								) : (
									<>
										Send message
										<ArrowUpRight size={16} />
									</>
								)}
							</button>
						</form>
					)}
				</div>
			}
		/>
	);
}
